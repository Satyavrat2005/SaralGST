# 🚀 Quick Start Guide - Invoice Processing

## Step 1: Database Setup (5 minutes)

### 1.1 Open Supabase SQL Editor
Go to your Supabase project → SQL Editor

### 1.2 Run Database Schema
Copy and paste the contents of `database_schema.sql` into the SQL editor and execute it.

This will create:
- ✅ `purchase_register` table
- ✅ `purchase_remarks` table
- ✅ Indexes for performance
- ✅ Helpful views
- ✅ Triggers

### 1.3 Create Storage Bucket (If Not Already Created)

**Your bucket is already set up!** You have:
- ✅ Bucket name: `SARALGST`
- ✅ Folder: `Purchase Invoice`

If you need to verify or adjust settings:
1. Go to Storage in Supabase dashboard
2. Check bucket `SARALGST` exists
3. Verify folder `Purchase Invoice` exists
4. Settings should be:
   - Public: Yes (or configure RLS policies)
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`

## Step 2: Environment Configuration (2 minutes)

Your `.env.local` should have:

```

✅ Already done! Your keys are configured.

## Step 3: Start Development Server

```bash
cd "d:\SATYAVART\B.E. Project\saral-gst"
npm run dev
```

Server will start at: http://localhost:3000

## Step 4: Test Invoice Upload

### 4.1 Navigate to Upload Page
Go to: http://localhost:3000/dashboard/sme/invoices/upload

### 4.2 Upload a Test Invoice
1. Click or drag a GST invoice PDF/image
2. Watch the progress:
   - Uploading... (blue)
   - Extracting Data... (amber)
   - Validating... (purple)
   - Completed (green) or Failed (red)

### 4.3 View in Purchase Register
Go to: http://localhost:3000/dashboard/sme/invoices/purchase

You should see:
- ✅ Your uploaded invoice in the table
- ✅ Summary statistics updated
- ✅ Validation status shown
- ✅ Source indicator (manual/whatsapp/etc)

## Step 5: Verify Data in Database

### 5.1 Check purchase_register Table
In Supabase → Table Editor → purchase_register

You should see a row with:
- Invoice number
- Supplier details
- Tax amounts
- Status (extracted/needs_review/error)

### 5.2 Check purchase_remarks Table (if validation errors)
In Supabase → Table Editor → purchase_remarks

Any validation errors will appear here with:
- Field name
- Issue type
- Detected vs expected values
- Status

## 🎯 What to Test

### ✅ Basic Upload
- [x] Upload a valid GST invoice PDF
- [x] Check progress indicators
- [x] Verify data in Purchase Register
- [x] Check extracted fields are correct

### ✅ Validation Testing
- [x] Upload invoice with incorrect GSTIN → Should show error
- [x] Upload invoice with wrong tax calculation → Should flag mismatch
- [x] Upload invoice with missing fields → Should mark needs_review

### ✅ Different Sources
- [x] Manual upload (use Upload page)
- [x] WhatsApp (via n8n - configure separately)
- [x] Check source icon displays correctly

### ✅ UI Features
- [x] Click invoice to view details modal
- [x] Check PDF preview (if URL is valid)
- [x] View validation tab in modal
- [x] Test filters and search

## 📊 Expected Behavior

### Successful Upload Flow
```
1. File selected → Shows in upload queue
2. Progress bar starts (0%)
3. "Uploading..." → 30%
4. "Extracting Data..." → 50%
5. "Validating..." → 80%
6. "Completed" → 100% ✅
7. Data visible in Purchase Register immediately
```

### Upload with Validation Issues
```
1-5. Same as above
6. "Completed" → 100% ⚠️ (with warning)
7. Status shows "Partial" (amber badge)
8. Remarks table contains validation errors
9. Modal shows validation issues in "Validation Results" tab
```

### Failed Upload
```
1-3. Same as above
4. "Failed" → 100% ❌ (red)
5. Error message displayed
6. Record created with status="error"
7. Check console for detailed error
```

## 🔍 Troubleshooting

### Issue: Upload fails immediately
**Check:**
- Supabase bucket exists and is named `invoices`
- Bucket is accessible (public or proper RLS policies)
- File type is PDF, JPG, or PNG
- File size < 10MB

### Issue: OCR extraction fails
**Check:**
- `GEMINI_API_KEY` is set in `.env.local`
- API key is valid and has quota
- File is readable (not corrupted)
- Console logs for specific error

### Issue: Validation errors
**Check:**
- Invoice has valid GSTIN (15 characters)
- Tax calculations are correct
- All mandatory fields present
- Date format is valid

### Issue: Data not showing in Purchase Register
**Check:**
- Database tables created successfully
- No SQL errors in Supabase logs
- API endpoint responding (check Network tab)
- Browser console for frontend errors

## 📝 Sample Test Invoices

Create test invoices with:

### Valid Invoice
```
Supplier: ABC Enterprises Pvt Ltd
GSTIN: 27ABCDE1234F1Z5
Invoice No: INV-2024-001
Date: 2024-01-04
Taxable: ₹10,000
CGST: ₹900
SGST: ₹900
Total: ₹11,800
```

### Invalid GSTIN (for testing validation)
```
GSTIN: 27INVALID123
→ Should show "Invalid GSTIN format" error
```

### Tax Mismatch (for testing validation)
```
Taxable: ₹10,000
CGST: ₹900
SGST: ₹800 (different from CGST)
→ Should show "CGST and SGST should be equal" warning
```

## 🎉 Success Criteria

You've successfully set up the system when:

✅ Invoice uploads without errors  
✅ Data appears in purchase_register table  
✅ Summary cards show correct totals  
✅ Validation status displays properly  
✅ Modal shows invoice details  
✅ PDF preview loads (if URL accessible)  
✅ Validation errors tracked in remarks  

## 🔗 Quick Links

- Upload Page: `/dashboard/sme/invoices/upload`
- Purchase Register: `/dashboard/sme/invoices/purchase`
- Supabase Dashboard: https://dyokdgnrfdnpcnetftdk.supabase.co
- API Endpoint: `/api/invoice/process`

## 💡 Pro Tips

1. **Start Simple**: Test with a clear, well-formatted PDF first
2. **Check Logs**: Always check browser console and Supabase logs
3. **Test Validation**: Intentionally upload invalid invoices to test error handling
4. **Use Real Invoices**: Eventually test with actual GST invoices from vendors
5. **Monitor Confidence**: Low confidence scores may indicate OCR issues

## 🆘 Getting Help

If you encounter issues:

1. Check browser console (F12) for errors
2. Check Supabase logs for database errors
3. Review `INVOICE_PROCESSING_SETUP.md` for detailed documentation
4. Check Network tab to see API responses
5. Verify all environment variables are set

---

**Ready to Go!** 🚀

Start by running the database schema, then upload your first invoice!