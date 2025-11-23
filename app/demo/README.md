# GST Reconciliation Demo Workflow

## Overview
This demo showcases the complete end-to-end GST reconciliation workflow powered by n8n automation and AI validation. The interface is inspired by the reconciliation run page, providing a familiar and intuitive experience.

## User Experience

The demo follows a **3-state workflow** similar to the reconciliation run page:

### 1. **Idle State** - Ready to Start
- Overview of system capabilities
- Statistics on available data (invoices, GSTR 2B entries, vendors)
- Feature highlights (AI OCR, WhatsApp alerts, compliance scoring)
- Prominent "Start Demo Workflow" button

### 2. **Running State** - Live Processing
- Circular progress indicator showing completion percentage
- Real-time step-by-step progress through 9 automated stages
- Live statistics updating during processing
- Cancel option available

### 3. **Completed State** - Results & Downloads
- Success metrics (validated invoices, match rate, ITC available)
- Issue summary (discrepancies found, vendor compliance score)
- **Downloadable reports section**:
  - Reconciliation Report (PDF)
  - Discrepancy Report (Excel)
  - Draft GSTR 3B (JSON)
  - Draft GSTR 9B (JSON)
- Options to run again or start free trial

## Features

### 9-Step Automated Workflow

1. **Invoice Capture from WhatsApp** - Receive invoices from suppliers
2. **AI OCR & Validation** - Extract and validate data automatically
3. **Auto WhatsApp Notifications** - Send alerts for failed validations
4. **Purchase Register Update** - Insert validated invoices
5. **GSTR 2B Processing** - Parse and validate government data
6. **Intelligent Reconciliation** - Match invoices with GSTR 2B
7. **Discrepancy Analysis** - Categorize and calculate ITC impact
8. **Vendor Compliance Scoring** - Assess vendor reliability
9. **Report Generation & Filing** - Create reports and draft returns

## n8n Integration

### Webhook Endpoints

Configure these environment variables in your `.env.local`:

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://your-n8n-instance:5678/webhook
```

### Required n8n Workflows

1. **Main Workflow**: `gst-reconciliation`
   - Endpoint: `POST /webhook/gst-reconciliation`
   - Handles complete workflow orchestration

2. **WhatsApp Integration**: `whatsapp-handler`
   - Endpoint: `POST /webhook/whatsapp/send`
   - Sends automated messages

3. **GSTR 2B Processing**: `gstr2b-processor`
   - Endpoint: `POST /webhook/gstr2b/upload`
   - Processes uploaded files

4. **Status Polling**: `workflow-status`
   - Endpoint: `GET /webhook/gst-reconciliation/status`
   - Returns current workflow state

### Webhook Payload Structure

**Start Workflow:**
```json
{
  "action": "start",
  "demo": true,
  "data": {
    "userId": "user_123",
    "gstin": "27AAACW1234F1Z5"
  }
}
```

**Status Response:**
```json
{
  "workflowId": "workflow_12345",
  "status": "running",
  "currentStep": 3,
  "data": {
    "invoicesProcessed": 5,
    "validationsPassed": 3,
    "discrepancies": 2
  }
}
```

## Usage

### Starting the Demo

1. Click "Watch Demo" button on the landing page
2. Demo workflow page opens
3. Click "Start Demo" to begin execution
4. Watch real-time progress through all 9 steps

### Controls

- **Start Demo**: Begins workflow execution
- **Pause**: Pauses current execution (can resume)
- **Reset**: Resets workflow to initial state
- **Auto-play**: Toggle automatic step progression

### Real-time Updates

The demo supports:
- Live progress tracking
- Step-by-step status updates
- Real-time statistics
- Dynamic data visualization

### Monitoring

Left sidebar shows live statistics:
- Total invoices processed
- ITC available/blocked
- Compliance score
- Discrepancy count
- Notifications sent

## File Structure

```
app/demo/
├── page.tsx                    # Main demo page
├── components/
│   ├── WorkflowStep.tsx       # Individual step component
│   ├── StatsPanel.tsx         # Statistics sidebar
│   ├── InvoiceCard.tsx        # Invoice display card
│   └── DiscrepancyCard.tsx    # Discrepancy display card
└── utils/
    ├── n8nIntegration.ts      # n8n API integration
    └── mockData.ts            # Demo data and helpers
```

## Customization

### Adding New Steps

1. Update the `steps` array in `page.tsx`
2. Add step execution logic in `executeStep()`
3. Create corresponding n8n workflow node

### Modifying Data

Edit `utils/mockData.ts` to:
- Change mock invoices
- Modify discrepancy scenarios
- Update vendor scores
- Adjust execution timings

### Styling

All components use the same theme as the rest of the application:
- Glass panels with backdrop blur
- Primary color: Emerald green (#10B981)
- Dark mode optimized
- Responsive design

## n8n Workflow Setup

### Example n8n Workflow Structure

1. **Webhook Trigger Node**
   - Listen for POST requests
   - Extract payload data

2. **WhatsApp Listener Node**
   - Monitor incoming messages
   - Extract invoice attachments

3. **AI OCR Node**
   - Process images/PDFs
   - Extract structured data

4. **Validation Node**
   - Run validation rules
   - Check GSTIN format
   - Verify tax calculations

5. **Database Node**
   - Insert validated invoices
   - Update Purchase Register

6. **Reconciliation Node**
   - Compare registers
   - Identify discrepancies

7. **Notification Node**
   - Send WhatsApp alerts
   - Track delivery

8. **Report Generator Node**
   - Create PDF/Excel reports
   - Generate draft returns

## API Reference

See `utils/n8nIntegration.ts` for complete API documentation:

- `triggerN8nWorkflow()` - Start workflow
- `getWorkflowStatus()` - Poll status
- `subscribeToWorkflowUpdates()` - Real-time updates
- `sendWhatsAppMessage()` - Send notifications
- `uploadGSTR2B()` - Upload files
- `getReconciliationResults()` - Fetch results
- `downloadReport()` - Export reports

## Support

For issues or questions:
1. Check n8n webhook logs
2. Verify environment variables
3. Test webhooks with curl/Postman
4. Review browser console for errors
