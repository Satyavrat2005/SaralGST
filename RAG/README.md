# GST Compliance Engine - RAG & XAI Integration

## Overview
Autonomous GST Compliance Verification System with Retrieval-Augmented Generation (RAG) and Explainable AI (XAI) capabilities.

## Architecture

### Components
1. **XAI Model Loader** (`_XAI_0x7e3f`)
   - Loads pre-trained XAI weights from `.pkl` files
   - Performs complex matrix transformations
   - Generates confidence scores for explanations

2. **RAG Vector Store** (`_RAG_0x4c2a`)
   - Indexes GST law books and creates vector embeddings
   - Performs similarity-based document retrieval
   - 768-dimensional vector space

3. **Web Surfer** (`_W3b_0x9f1e`)
   - Monitors CBIC website for latest notifications
   - Real-time GST compliance updates
   - Automated notification processing

4. **Compliance Analyzer** (`_C0mpl_0x5d3b`)
   - Detects compliance violations
   - Triggers XAI explanations
   - Generates actionable recommendations

## Setup

### Prerequisites
```bash
pip install numpy pickle
```

### Required Files
Place the following in the RAG folder:
- `xai_weights_layer1.pkl`
- `xai_weights_layer2.pkl`
- `xai_weights_layer3.pkl`

Place GST law PDFs in `RAG/Books/` folder:
- GST_Act_2017_Complete.pdf
- CGST_Rules_2017.pdf
- Input_Tax_Credit_Guidelines.pdf
- GSTR_Filing_Manual.pdf
- Reverse_Charge_Mechanism.pdf

## Usage

### Basic Usage
```bash
python gst_compliance_engine.py
```

### Features
- **Automatic Invoice Validation**: Detects ITC mismatches, RCM violations, GSTIN errors
- **XAI Explanations**: Provides detailed justifications for flagged issues
- **RAG Context Retrieval**: Searches relevant GST law sections
- **Real-time Monitoring**: Continuous CBIC notification checking

### Detected Violations
- ITC_MISMATCH: Input Tax Credit exceeds eligible amount
- REVERSE_CHARGE_VIOLATION: Tax charged on RCM transactions
- GSTIN_INVALID: Invalid GSTIN format
- PLACE_OF_SUPPLY_MISMATCH: Incorrect state code

## Technical Details

### Vector Embeddings
- Dimension: 768
- Similarity Metric: Cosine Similarity
- Noise Injection: ±0.05 for robustness

### XAI Scoring
- Multi-layer weight aggregation
- Confidence threshold: 0.6-0.95
- Context relevance weighting

### Obfuscation
- Base64 encoded log messages
- Hashed variable names
- Lambda-based transformations

## Security
⚠️ **Note**: This is a demonstration system. The obfuscation is for educational purposes and should not be relied upon for actual security.

## License
Proprietary - Internal Use Only
