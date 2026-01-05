/**
 * OCR Service for extracting text from invoice PDFs/images
 * Using Google Cloud Vision API
 */

export interface OCRResult {
  rawText: string;
  confidence: number;
  blocks?: OCRBlock[];
  tables?: OCRTable[];
  success: boolean;
  error?: string;
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRTable {
  rows: string[][];
  confidence: number;
}

/**
 * Extract text from invoice file using OCR
 * @param fileBuffer - The file buffer (PDF or image)
 * @param mimeType - MIME type of the file
 * @returns OCR extraction results
 */
export async function extractTextFromInvoice(
  fileBuffer: Buffer,
  mimeType: string
): Promise<OCRResult> {
  try {
    // Convert file to base64
    const base64File = fileBuffer.toString('base64');

    // For PDFs, we need to convert to image first or use document text detection
    if (mimeType === 'application/pdf') {
      return await extractFromPDF(base64File);
    } else {
      return await extractFromImage(base64File);
    }
  } catch (error: any) {
    console.error('Error in OCR extraction:', error);
    return {
      rawText: '',
      confidence: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract text from PDF using Google Cloud Vision API
 */
async function extractFromPDF(base64File: string): Promise<OCRResult> {
  try {
    // Use Google Cloud Vision API for document text detection
    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!visionApiKey) {
      // Fallback: Use Gemini API for basic text extraction
      return await fallbackTextExtraction(base64File);
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64File,
              },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.responses && data.responses[0]) {
      const annotation = data.responses[0].fullTextAnnotation;
      
      if (annotation) {
        return {
          rawText: annotation.text || '',
          confidence: calculateAverageConfidence(annotation.pages),
          blocks: extractBlocks(annotation.pages),
          success: true,
        };
      }
    }

    return {
      rawText: '',
      confidence: 0,
      success: false,
      error: 'No text detected in document',
    };
  } catch (error: any) {
    console.error('Error extracting from PDF:', error);
    // Fallback to basic extraction
    return await fallbackTextExtraction(base64File);
  }
}

/**
 * Extract text from image using Google Cloud Vision API
 */
async function extractFromImage(base64File: string): Promise<OCRResult> {
  try {
    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!visionApiKey) {
      return await fallbackTextExtraction(base64File);
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64File,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.responses && data.responses[0]) {
      const textAnnotations = data.responses[0].textAnnotations;
      
      if (textAnnotations && textAnnotations.length > 0) {
        return {
          rawText: textAnnotations[0].description || '',
          confidence: textAnnotations[0].confidence || 0.8,
          success: true,
        };
      }
    }

    return {
      rawText: '',
      confidence: 0,
      success: false,
      error: 'No text detected in image',
    };
  } catch (error: any) {
    console.error('Error extracting from image:', error);
    return await fallbackTextExtraction(base64File);
  }
}

/**
 * Fallback text extraction using Gemini Vision API
 */
async function fallbackTextExtraction(base64File: string): Promise<OCRResult> {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return {
        rawText: '',
        confidence: 0,
        success: false,
        error: 'No OCR API key configured',
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Extract all text from this invoice document. Return only the raw text content, maintaining the original layout and structure as much as possible.',
                },
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: base64File,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content?.parts?.[0]?.text || '';
      
      return {
        rawText: text,
        confidence: 0.75, // Estimated confidence for fallback method
        success: true,
      };
    }

    return {
      rawText: '',
      confidence: 0,
      success: false,
      error: 'Failed to extract text using fallback method',
    };
  } catch (error: any) {
    console.error('Error in fallback text extraction:', error);
    return {
      rawText: '',
      confidence: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate average confidence from Vision API pages
 */
function calculateAverageConfidence(pages?: any[]): number {
  if (!pages || pages.length === 0) return 0.8;
  
  let totalConfidence = 0;
  let count = 0;

  pages.forEach(page => {
    page.blocks?.forEach((block: any) => {
      if (block.confidence !== undefined) {
        totalConfidence += block.confidence;
        count++;
      }
    });
  });

  return count > 0 ? totalConfidence / count : 0.8;
}

/**
 * Extract structured blocks from Vision API pages
 */
function extractBlocks(pages?: any[]): OCRBlock[] {
  if (!pages || pages.length === 0) return [];
  
  const blocks: OCRBlock[] = [];

  pages.forEach(page => {
    page.blocks?.forEach((block: any) => {
      const text = block.paragraphs
        ?.map((p: any) => 
          p.words?.map((w: any) => 
            w.symbols?.map((s: any) => s.text).join('')
          ).join(' ')
        )
        .join('\n') || '';

      if (text) {
        blocks.push({
          text,
          confidence: block.confidence || 0.8,
          boundingBox: extractBoundingBox(block.boundingBox),
        });
      }
    });
  });

  return blocks;
}

/**
 * Extract bounding box coordinates
 */
function extractBoundingBox(boundingBox?: any): OCRBlock['boundingBox'] {
  if (!boundingBox || !boundingBox.vertices) return undefined;

  const vertices = boundingBox.vertices;
  const xs = vertices.map((v: any) => v.x || 0);
  const ys = vertices.map((v: any) => v.y || 0);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}
