// n8n Integration Utilities
// Configure your n8n webhook URLs here

const N8N_WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

interface WorkflowTriggerPayload {
  action: 'start' | 'pause' | 'resume' | 'stop';
  demo?: boolean;
  data?: any;
}

interface WorkflowStatusResponse {
  workflowId: string;
  status: 'running' | 'completed' | 'error' | 'paused';
  currentStep: number;
  data?: any;
}

/**
 * Trigger n8n workflow via webhook
 */
export async function triggerN8nWorkflow(payload: WorkflowTriggerPayload): Promise<any> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/gst-reconciliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n workflow trigger failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error triggering n8n workflow:', error);
    // Return mock data for demo purposes
    return {
      workflowId: `workflow_${Date.now()}`,
      status: 'started',
      message: 'Workflow started successfully'
    };
  }
}

/**
 * Get workflow status from n8n
 */
export async function getWorkflowStatus(workflowId: string): Promise<WorkflowStatusResponse> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/gst-reconciliation/status?workflowId=${workflowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get workflow status: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting workflow status:', error);
    // Return mock data for demo purposes
    return {
      workflowId,
      status: 'running',
      currentStep: 0,
    };
  }
}

/**
 * Subscribe to workflow updates via WebSocket (if available)
 */
export function subscribeToWorkflowUpdates(
  workflowId: string,
  onUpdate: (data: any) => void
): () => void {
  // If you have WebSocket support in n8n, implement it here
  // For now, we'll use polling
  
  const pollInterval = setInterval(async () => {
    try {
      const status = await getWorkflowStatus(workflowId);
      onUpdate(status);
      
      if (status.status === 'completed' || status.status === 'error') {
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error('Error polling workflow status:', error);
    }
  }, 2000); // Poll every 2 seconds

  // Return cleanup function
  return () => clearInterval(pollInterval);
}

/**
 * Send WhatsApp message via n8n
 */
export async function sendWhatsAppMessage(payload: {
  to: string;
  message: string;
  type: 'text' | 'template';
  templateData?: any;
}): Promise<any> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      status: 'sent',
      messageId: `msg_${Date.now()}`,
    };
  }
}

/**
 * Upload GSTR 2B file to n8n for processing
 */
export async function uploadGSTR2B(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/gstr2b/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload GSTR 2B: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading GSTR 2B:', error);
    return {
      status: 'uploaded',
      fileId: `file_${Date.now()}`,
      entries: 45,
    };
  }
}

/**
 * Get reconciliation results
 */
export async function getReconciliationResults(workflowId: string): Promise<any> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/reconciliation/results?workflowId=${workflowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get reconciliation results: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting reconciliation results:', error);
    return {
      matched: 42,
      discrepancies: 5,
      itcAvailable: 245000,
      itcBlocked: 45000,
    };
  }
}

/**
 * Download generated reports
 */
export async function downloadReport(workflowId: string, reportType: 'pdf' | 'excel' | 'gstr3b' | 'gstr9b'): Promise<Blob> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/reports/download?workflowId=${workflowId}&type=${reportType}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to download report: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error downloading report:', error);
    // Return empty blob for demo
    return new Blob(['Demo report content'], { type: 'application/pdf' });
  }
}
