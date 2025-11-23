# GST Reconciliation Demo Workflow

## Overview
This demo showcases the complete end-to-end GST reconciliation workflow powered by n8n automation and AI validation.

## Features

### 9-Step Automated Workflow

1. **Invoice Capture from WhatsApp**
   - Receives invoices from multiple suppliers via WhatsApp
   - Real-time processing with status tracking

2. **AI OCR & Validation**
   - Automated data extraction using OCR
   - Validates GSTIN, amounts, tax rates, and quantities
   - Instant validation feedback

3. **Auto WhatsApp Notifications**
   - Sends correction requests for failed validations
   - Tracks delivery status and responses
   - Automated follow-ups

4. **Purchase Register Update**
   - Inserts validated invoices automatically
   - Detects duplicates and conflicts
   - Maintains data integrity

5. **GSTR 2B Upload & Parsing**
   - Processes uploaded GSTR 2B files
   - Validates schema and data integrity
   - Extracts all entries for reconciliation

6. **Intelligent Reconciliation**
   - Cross-references Purchase Register with GSTR 2B
   - Matches entries with fuzzy logic
   - Identifies discrepancies

7. **Discrepancy Analysis**
   - Categorizes issues by type and severity
   - Calculates ITC impact
   - Prioritizes critical items

8. **Vendor Compliance Scoring**
   - Calculates compliance scores
   - Tracks filing history and reliability
   - Identifies at-risk vendors

9. **Report Generation & Filing**
   - Creates comprehensive forensic reports
   - Generates draft GSTR 3B and 9B
   - Exports in multiple formats

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
