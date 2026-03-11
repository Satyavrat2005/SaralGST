import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  requestOTP,
  getAuthToken,
  getGSTR1Summary,
  getGSTR1B2B,
  saveGSTR1,
  submitGSTR1,
  getGSTR2B,
  getGSTR2BSummary,
  getGSTR3BSummary,
  saveGSTR3B,
  submitGSTR3B,
  getReturnStatus,
  viewAndTrackReturns,
  MASTERGST_CONFIG,
  getFinancialYear,
  parseReturnPeriod,
} from '@/lib/services/masterGSTService';

// GET /api/returns?action=...&type=...&period=...
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const returnType = url.searchParams.get('type');
  const period = url.searchParams.get('period');

  try {
    switch (action) {
      // ============ LIST RETURNS ============
      case 'list': {
        let query = supabase
          .from('gst_returns')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (returnType) query = query.eq('return_type', returnType);
        if (period) query = query.eq('return_period', period);
        if (user) query = query.eq('user_id', user.id);
        
        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GET SPECIFIC RETURN ============
      case 'get': {
        const returnId = url.searchParams.get('id');
        if (!returnId) return NextResponse.json({ error: 'Missing return ID' }, { status: 400 });
        
        const { data, error } = await supabase
          .from('gst_returns')
          .select('*')
          .eq('id', returnId)
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GET GSTR1 INVOICES ============
      case 'gstr1-invoices': {
        if (!period) return NextResponse.json({ error: 'Missing period' }, { status: 400 });
        
        const { data, error } = await supabase
          .from('gstr1_invoices')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
        
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GET GSTR2B DATA ============
      case 'gstr2b-data': {
        const returnId = url.searchParams.get('id');
        let query = supabase
          .from('gstr2b_data')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (returnId) query = query.eq('return_id', returnId);
        if (user) query = query.eq('user_id', user.id);
        
        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GET GSTR3B DATA ============
      case 'gstr3b-data': {
        const returnId = url.searchParams.get('id');
        if (!returnId) return NextResponse.json({ error: 'Missing return ID' }, { status: 400 });
        
        const { data, error } = await supabase
          .from('gstr3b_data')
          .select('*')
          .eq('return_id', returnId)
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GENERATE GSTR1 FROM SALES REGISTER ============
      case 'generate-gstr1': {
        if (!period || !user) return NextResponse.json({ error: 'Missing period or user' }, { status: 400 });
        
        const { month, year } = parseReturnPeriod(period);
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
        
        // Fetch sales invoices for the period (include null user_id for legacy/uploaded data)
        const { data: salesInvoices, error: salesErr } = await supabase
          .from('sales_invoices')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate);
        
        if (salesErr) return NextResponse.json({ error: salesErr.message }, { status: 500 });

        // Create or update gst_returns record
        const existingReturn = await supabase
          .from('gst_returns')
          .select('id')
          .eq('user_id', user.id)
          .eq('return_type', 'GSTR1')
          .eq('return_period', period)
          .single();

        let returnId: string;

        if (existingReturn.data) {
          returnId = existingReturn.data.id;
          // Delete old gstr1_invoices for this return
          await supabase.from('gstr1_invoices').delete().eq('return_id', returnId);
        } else {
          const fy = getFinancialYear(month, year);
          const { data: newReturn, error: createErr } = await supabase
            .from('gst_returns')
            .insert({
              user_id: user.id,
              gstin: MASTERGST_CONFIG.gstin,
              return_type: 'GSTR1',
              return_period: period,
              financial_year: fy,
              status: 'draft',
            })
            .select('id')
            .single();
          if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
          returnId = newReturn.id;
        }

        // Transform sales invoices into GSTR1 format
        const gstr1Invoices = (salesInvoices || []).map((inv: any) => {
          const isInterState = inv.igst_amount > 0;
          const section = inv.customer_gstin ? 'b2b' : 
                         (inv.gross_total > 250000 && isInterState ? 'b2cl' : 'b2cs');
          
          return {
            return_id: returnId,
            user_id: user.id,
            section,
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            invoice_value: inv.gross_total || 0,
            place_of_supply: inv.place_of_supply || MASTERGST_CONFIG.state_cd,
            counterparty_gstin: inv.customer_gstin,
            counterparty_name: inv.customer_name,
            taxable_value: inv.taxable_value || 0,
            igst_amount: inv.igst_amount || 0,
            cgst_amount: inv.cgst_amount || 0,
            sgst_amount: inv.sgst_amount || 0,
            cess_amount: inv.tcs_cess || 0,
            tax_rate: inv.taxable_value > 0 
              ? Math.round(((inv.igst_amount || 0) + (inv.cgst_amount || 0) + (inv.sgst_amount || 0)) / inv.taxable_value * 100) 
              : 0,
            invoice_type: inv.reverse_charge ? 'R' : 'R',
            reverse_charge: inv.reverse_charge || false,
            hsn_code: inv.hsn_sac_code,
            description: inv.voucher_type,
            uqc: inv.uqc,
            quantity: inv.quantity,
            validation_status: 'valid',
            source: 'sales_register',
            source_invoice_id: inv.id,
          };
        });

        if (gstr1Invoices.length > 0) {
          const { error: insertErr } = await supabase
            .from('gstr1_invoices')
            .insert(gstr1Invoices);
          if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        // Calculate totals
        const totals = gstr1Invoices.reduce((acc: any, inv: any) => ({
          taxable: acc.taxable + (inv.taxable_value || 0),
          igst: acc.igst + (inv.igst_amount || 0),
          cgst: acc.cgst + (inv.cgst_amount || 0),
          sgst: acc.sgst + (inv.sgst_amount || 0),
          cess: acc.cess + (inv.cess_amount || 0),
        }), { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });

        // Update return with totals
        await supabase
          .from('gst_returns')
          .update({
            status: 'generated',
            total_taxable_value: totals.taxable,
            total_igst: totals.igst,
            total_cgst: totals.cgst,
            total_sgst: totals.sgst,
            total_cess: totals.cess,
            total_tax: totals.igst + totals.cgst + totals.sgst + totals.cess,
            total_invoices: gstr1Invoices.length,
          })
          .eq('id', returnId);

        return NextResponse.json({ 
          success: true, 
          returnId,
          totalInvoices: gstr1Invoices.length,
          totals,
        });
      }

      // ============ GENERATE GSTR3B FROM REGISTERS ============
      case 'generate-gstr3b': {
        if (!period || !user) return NextResponse.json({ error: 'Missing period or user' }, { status: 400 });
        
        const { month, year } = parseReturnPeriod(period);
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        
        // Fetch sales invoices for output tax computation (include null user_id for legacy data)
        const { data: salesInvoices } = await supabase
          .from('sales_invoices')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate);

        // Fetch purchase invoices for ITC computation (purchase_register has no user_id column)
        const { data: purchaseInvoices } = await supabase
          .from('purchase_register')
          .select('*')
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate);

        // Compute Section 3.1 totals from sales
        const sales = salesInvoices || [];
        const sec_3_1_a = sales.filter((s: any) => !s.reverse_charge);
        const sec_3_1_d = (purchaseInvoices || []).filter((p: any) => p.is_reverse_charge);

        const s31a = sec_3_1_a.reduce((acc: any, s: any) => ({
          taxable: acc.taxable + (s.taxable_value || 0),
          igst: acc.igst + (s.igst_amount || 0),
          cgst: acc.cgst + (s.cgst_amount || 0),
          sgst: acc.sgst + (s.sgst_amount || 0),
          cess: acc.cess + (s.tcs_cess || 0),
        }), { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });

        const s31d = sec_3_1_d.reduce((acc: any, p: any) => ({
          taxable: acc.taxable + (p.taxable_value || 0),
          igst: acc.igst + (p.igst_amount || 0),
          cgst: acc.cgst + (p.cgst_amount || 0),
          sgst: acc.sgst + (p.sgst_amount || 0),
          cess: acc.cess + (p.cess_amount || 0),
        }), { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });

        // Compute Section 4 ITC from purchases
        const eligiblePurchases = (purchaseInvoices || []).filter((p: any) => p.is_itc_eligible);
        const itc = eligiblePurchases.reduce((acc: any, p: any) => ({
          igst: acc.igst + (p.igst_amount || 0),
          cgst: acc.cgst + (p.cgst_amount || 0),
          sgst: acc.sgst + (p.sgst_amount || 0),
          cess: acc.cess + (p.cess_amount || 0),
        }), { igst: 0, cgst: 0, sgst: 0, cess: 0 });

        // Create/update return
        const existingReturn = await supabase
          .from('gst_returns')
          .select('id')
          .eq('user_id', user.id)
          .eq('return_type', 'GSTR3B')
          .eq('return_period', period)
          .single();

        let returnId: string;
        const fy = getFinancialYear(month, year);

        if (existingReturn.data) {
          returnId = existingReturn.data.id;
          await supabase.from('gstr3b_data').delete().eq('return_id', returnId);
        } else {
          const { data: newReturn, error: createErr } = await supabase
            .from('gst_returns')
            .insert({
              user_id: user.id,
              gstin: MASTERGST_CONFIG.gstin,
              return_type: 'GSTR3B',
              return_period: period,
              financial_year: fy,
              status: 'draft',
            })
            .select('id')
            .single();
          if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
          returnId = newReturn.id;
        }

        // Compute payment section
        const totalOutputTax = {
          igst: s31a.igst + s31d.igst,
          cgst: s31a.cgst + s31d.cgst,
          sgst: s31a.sgst + s31d.sgst,
          cess: s31a.cess + s31d.cess,
        };
        const totalITC = itc;
        
        const cashPayable = {
          igst: Math.max(0, totalOutputTax.igst - totalITC.igst),
          cgst: Math.max(0, totalOutputTax.cgst - totalITC.cgst),
          sgst: Math.max(0, totalOutputTax.sgst - totalITC.sgst),
          cess: Math.max(0, totalOutputTax.cess - totalITC.cess),
        };

        // Insert GSTR3B data
        const { error: insertErr } = await supabase
          .from('gstr3b_data')
          .insert({
            return_id: returnId,
            user_id: user.id,
            sec_3_1_a_taxable: s31a.taxable,
            sec_3_1_a_igst: s31a.igst,
            sec_3_1_a_cgst: s31a.cgst,
            sec_3_1_a_sgst: s31a.sgst,
            sec_3_1_a_cess: s31a.cess,
            sec_3_1_d_taxable: s31d.taxable,
            sec_3_1_d_igst: s31d.igst,
            sec_3_1_d_cgst: s31d.cgst,
            sec_3_1_d_sgst: s31d.sgst,
            sec_3_1_d_cess: s31d.cess,
            sec_4_a5_igst: itc.igst,
            sec_4_a5_cgst: itc.cgst,
            sec_4_a5_sgst: itc.sgst,
            sec_4_a5_cess: itc.cess,
            sec_6_1_igst_tax: totalOutputTax.igst,
            sec_6_1_igst_itc: Math.min(totalOutputTax.igst, totalITC.igst),
            sec_6_1_igst_cash: cashPayable.igst,
            sec_6_1_cgst_tax: totalOutputTax.cgst,
            sec_6_1_cgst_itc: Math.min(totalOutputTax.cgst, totalITC.cgst),
            sec_6_1_cgst_cash: cashPayable.cgst,
            sec_6_1_sgst_tax: totalOutputTax.sgst,
            sec_6_1_sgst_itc: Math.min(totalOutputTax.sgst, totalITC.sgst),
            sec_6_1_sgst_cash: cashPayable.sgst,
            sec_6_1_cess_tax: totalOutputTax.cess,
            sec_6_1_cess_cash: cashPayable.cess,
          });
        
        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

        const totalTax = totalOutputTax.igst + totalOutputTax.cgst + totalOutputTax.sgst + totalOutputTax.cess;
        const totalCash = cashPayable.igst + cashPayable.cgst + cashPayable.sgst + cashPayable.cess;
        
        await supabase
          .from('gst_returns')
          .update({
            status: 'generated',
            total_taxable_value: s31a.taxable + s31d.taxable,
            total_igst: totalOutputTax.igst,
            total_cgst: totalOutputTax.cgst,
            total_sgst: totalOutputTax.sgst,
            total_cess: totalOutputTax.cess,
            total_tax: totalTax,
            total_invoices: sales.length,
          })
          .eq('id', returnId);

        return NextResponse.json({
          success: true,
          returnId,
          outputTax: totalOutputTax,
          itcAvailable: totalITC,
          cashPayable,
          totalTax,
          totalCash,
        });
      }

      // ============ FILING HISTORY ============
      case 'history': {
        const fy = url.searchParams.get('fy');
        let query = supabase
          .from('gst_returns')
          .select('*')
          .order('filed_date', { ascending: false });
        
        if (user) query = query.eq('user_id', user.id);
        if (fy) query = query.eq('financial_year', fy);
        if (returnType) query = query.eq('return_type', returnType);
        
        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/returns - Create/Update/File returns
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      // ============ REQUEST OTP ============
      case 'request-otp': {
        const result = await requestOTP();
        if (result.success) {
          // Store txn for later use
          await supabase.from('mastergst_auth_tokens').upsert({
            user_id: user.id,
            gstin: MASTERGST_CONFIG.gstin,
            txn: result.txn,
          }, { onConflict: 'user_id,gstin' });
        }
        return NextResponse.json(result);
      }

      // ============ VERIFY OTP & GET AUTH TOKEN ============
      case 'verify-otp': {
        const { otp } = body;
        // Get stored txn
        const { data: tokenData } = await supabase
          .from('mastergst_auth_tokens')
          .select('txn')
          .eq('user_id', user.id)
          .eq('gstin', MASTERGST_CONFIG.gstin)
          .single();
        
        if (!tokenData?.txn) {
          return NextResponse.json({ error: 'No pending OTP request' }, { status: 400 });
        }

        const result = await getAuthToken(otp, tokenData.txn);
        if (result.success) {
          await supabase.from('mastergst_auth_tokens').upsert({
            user_id: user.id,
            gstin: MASTERGST_CONFIG.gstin,
            auth_token: result.authToken,
            txn: result.txn,
            expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hrs
          }, { onConflict: 'user_id,gstin' });
        }
        return NextResponse.json(result);
      }

      // ============ SAVE GSTR1 TO PORTAL ============
      case 'save-gstr1': {
        const { returnId, period } = body;
        
        // Get auth token
        const { data: tokenData } = await supabase
          .from('mastergst_auth_tokens')
          .select('auth_token, txn')
          .eq('user_id', user.id)
          .eq('gstin', MASTERGST_CONFIG.gstin)
          .single();

        if (!tokenData?.auth_token) {
          return NextResponse.json({ error: 'Not authenticated with GST portal. Please verify OTP first.' }, { status: 401 });
        }

        // Fetch GSTR1 invoices
        const { data: invoices } = await supabase
          .from('gstr1_invoices')
          .select('*')
          .eq('return_id', returnId);

        // Transform to GSTN format
        const payload = transformToGSTNFormat(invoices || [], period);
        const result = await saveGSTR1(period, tokenData.txn, payload);

        // Update return status
        await supabase.from('gst_returns').update({
          status: 'submitted',
          api_reference_id: result.reference_id || result.ref_id,
          api_status: result.status_cd === '1' ? 'success' : 'error',
          api_response: result,
        }).eq('id', returnId);

        return NextResponse.json(result);
      }

      // ============ SAVE GSTR3B TO PORTAL ============ 
      case 'save-gstr3b': {
        const { returnId, period } = body;
        
        const { data: tokenData } = await supabase
          .from('mastergst_auth_tokens')
          .select('auth_token, txn')
          .eq('user_id', user.id)
          .eq('gstin', MASTERGST_CONFIG.gstin)
          .single();

        if (!tokenData?.auth_token) {
          return NextResponse.json({ error: 'Not authenticated with GST portal. Please verify OTP first.' }, { status: 401 });
        }

        // Fetch GSTR3B data
        const { data: gstr3b } = await supabase
          .from('gstr3b_data')
          .select('*')
          .eq('return_id', returnId)
          .single();

        if (!gstr3b) {
          return NextResponse.json({ error: 'No GSTR-3B data found' }, { status: 404 });
        }

        // Transform to GSTN format
        const payload = transformGSTR3BToGSTNFormat(gstr3b, period);
        const result = await saveGSTR3B(period, tokenData.txn, payload);

        await supabase.from('gst_returns').update({
          status: 'submitted',
          api_reference_id: result.reference_id || result.ref_id,
          api_status: result.status_cd === '1' ? 'success' : 'error',
          api_response: result,
        }).eq('id', returnId);

        return NextResponse.json(result);
      }

      // ============ FETCH GSTR2B FROM PORTAL ============
      case 'fetch-gstr2b': {
        const { period } = body;
        
        const { data: tokenData } = await supabase
          .from('mastergst_auth_tokens')
          .select('auth_token, txn')
          .eq('user_id', user.id)
          .eq('gstin', MASTERGST_CONFIG.gstin)
          .single();

        if (!tokenData?.auth_token) {
          return NextResponse.json({ error: 'Not authenticated with GST portal. Please verify OTP first.' }, { status: 401 });
        }

        const result = await getGSTR2B(period, tokenData.txn);
        
        if (result.error) {
          return NextResponse.json({ error: result.message || 'Failed to fetch GSTR-2B' }, { status: 500 });
        }

        // Create/update return record
        const { month, year } = parseReturnPeriod(period);
        const fy = getFinancialYear(month, year);
        
        const existingReturn = await supabase
          .from('gst_returns')
          .select('id')
          .eq('user_id', user.id)
          .eq('return_type', 'GSTR2B')
          .eq('return_period', period)
          .single();

        let returnId: string;
        if (existingReturn.data) {
          returnId = existingReturn.data.id;
          await supabase.from('gstr2b_data').delete().eq('return_id', returnId);
        } else {
          const { data: newReturn, error: createErr } = await supabase
            .from('gst_returns')
            .insert({
              user_id: user.id,
              gstin: MASTERGST_CONFIG.gstin,
              return_type: 'GSTR2B',
              return_period: period,
              financial_year: fy,
              status: 'generated',
            }).select('id').single();
          if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
          returnId = newReturn.id;
        }

        // Parse and store GSTR2B data
        const gstr2bInvoices = parseGSTR2BResponse(result, returnId, user.id);
        
        if (gstr2bInvoices.length > 0) {
          const { error: insertErr } = await supabase
            .from('gstr2b_data')
            .insert(gstr2bInvoices);
          if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        // Update totals
        const totals = gstr2bInvoices.reduce((acc: any, inv: any) => ({
          taxable: acc.taxable + (inv.taxable_value || 0),
          igst: acc.igst + (inv.igst_amount || 0),
          cgst: acc.cgst + (inv.cgst_amount || 0),
          sgst: acc.sgst + (inv.sgst_amount || 0),
          cess: acc.cess + (inv.cess_amount || 0),
          itcIgst: acc.itcIgst + (inv.itc_igst || 0),
          itcCgst: acc.itcCgst + (inv.itc_cgst || 0),
          itcSgst: acc.itcSgst + (inv.itc_sgst || 0),
        }), { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, itcIgst: 0, itcCgst: 0, itcSgst: 0 });

        await supabase.from('gst_returns').update({
          status: 'generated',
          total_taxable_value: totals.taxable,
          total_igst: totals.igst,
          total_cgst: totals.cgst,
          total_sgst: totals.sgst,
          total_cess: totals.cess,
          total_tax: totals.igst + totals.cgst + totals.sgst + totals.cess,
          total_invoices: gstr2bInvoices.length,
          api_response: result,
        }).eq('id', returnId);

        return NextResponse.json({
          success: true,
          returnId,
          totalInvoices: gstr2bInvoices.length,
          totals,
        });
      }

      // ============ UPDATE GSTR3B DATA ============
      case 'update-gstr3b': {
        const { returnId, data } = body;
        
        const { error } = await supabase
          .from('gstr3b_data')
          .update(data)
          .eq('return_id', returnId)
          .eq('user_id', user.id);
        
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      // ============ MARK RETURN AS FILED (manual) ============
      case 'mark-filed': {
        const { returnId, arn } = body;
        
        await supabase.from('gst_returns').update({
          status: 'filed',
          arn,
          filed_date: new Date().toISOString(),
          filed_by: user.email || 'System',
        }).eq('id', returnId).eq('user_id', user.id);
        
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============ HELPER: Transform invoices to GSTN B2B format ============
function transformToGSTNFormat(invoices: any[], period: string) {
  const b2bMap = new Map<string, any[]>();
  const b2clMap = new Map<string, any[]>();
  const b2csItems: any[] = [];

  invoices.forEach(inv => {
    if (inv.section === 'b2b' && inv.counterparty_gstin) {
      if (!b2bMap.has(inv.counterparty_gstin)) {
        b2bMap.set(inv.counterparty_gstin, []);
      }
      b2bMap.get(inv.counterparty_gstin)!.push(inv);
    } else if (inv.section === 'b2cl') {
      const pos = inv.place_of_supply || '33';
      if (!b2clMap.has(pos)) b2clMap.set(pos, []);
      b2clMap.get(pos)!.push(inv);
    } else if (inv.section === 'b2cs') {
      b2csItems.push(inv);
    }
  });

  const b2b = Array.from(b2bMap.entries()).map(([ctin, invs]) => ({
    ctin,
    inv: invs.map(inv => ({
      inum: inv.invoice_number,
      idt: formatDateForGSTN(inv.invoice_date),
      val: inv.invoice_value || 0,
      pos: inv.place_of_supply || '33',
      rchrg: inv.reverse_charge ? 'Y' : 'N',
      inv_typ: inv.invoice_type || 'R',
      itms: [{
        num: 1,
        itm_det: {
          rt: inv.tax_rate || 18,
          txval: inv.taxable_value || 0,
          iamt: inv.igst_amount || 0,
          camt: inv.cgst_amount || 0,
          samt: inv.sgst_amount || 0,
          csamt: inv.cess_amount || 0,
        }
      }]
    }))
  }));

  const b2cl = Array.from(b2clMap.entries()).map(([pos, invs]) => ({
    pos,
    inv: invs.map(inv => ({
      inum: inv.invoice_number,
      idt: formatDateForGSTN(inv.invoice_date),
      val: inv.invoice_value || 0,
      itms: [{
        num: 1,
        itm_det: {
          rt: inv.tax_rate || 18,
          txval: inv.taxable_value || 0,
          iamt: inv.igst_amount || 0,
          csamt: inv.cess_amount || 0,
        }
      }]
    }))
  }));

  // Aggregate B2CS by POS + rate
  const b2csAgg = new Map<string, any>();
  b2csItems.forEach(inv => {
    const key = `${inv.place_of_supply || '33'}_${inv.tax_rate || 18}_${inv.igst_amount > 0 ? 'INTER' : 'INTRA'}`;
    if (!b2csAgg.has(key)) {
      b2csAgg.set(key, {
        sply_ty: inv.igst_amount > 0 ? 'INTER' : 'INTRA',
        pos: inv.place_of_supply || '33',
        rt: inv.tax_rate || 18,
        txval: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0,
      });
    }
    const entry = b2csAgg.get(key)!;
    entry.txval += inv.taxable_value || 0;
    entry.iamt += inv.igst_amount || 0;
    entry.camt += inv.cgst_amount || 0;
    entry.samt += inv.sgst_amount || 0;
    entry.csamt += inv.cess_amount || 0;
  });

  return {
    gstin: MASTERGST_CONFIG.gstin,
    fp: period,
    b2b: b2b.length > 0 ? b2b : undefined,
    b2cl: b2cl.length > 0 ? b2cl : undefined,
    b2cs: b2csAgg.size > 0 ? Array.from(b2csAgg.values()) : undefined,
  };
}

function transformGSTR3BToGSTNFormat(data: any, period: string) {
  return {
    gstin: MASTERGST_CONFIG.gstin,
    ret_period: period,
    sup_details: {
      osup_det: {
        txval: data.sec_3_1_a_taxable || 0,
        iamt: data.sec_3_1_a_igst || 0,
        camt: data.sec_3_1_a_cgst || 0,
        samt: data.sec_3_1_a_sgst || 0,
        csamt: data.sec_3_1_a_cess || 0,
      },
      osup_zero: {
        txval: data.sec_3_1_b_taxable || 0,
        iamt: data.sec_3_1_b_igst || 0,
        csamt: 0,
      },
      osup_nil_exmp: {
        txval: data.sec_3_1_c_taxable || 0,
      },
      isup_rev: {
        txval: data.sec_3_1_d_taxable || 0,
        iamt: data.sec_3_1_d_igst || 0,
        camt: data.sec_3_1_d_cgst || 0,
        samt: data.sec_3_1_d_sgst || 0,
        csamt: data.sec_3_1_d_cess || 0,
      },
      osup_nongst: {
        txval: data.sec_3_1_e_taxable || 0,
      },
    },
    itc_elg: {
      itc_avl: [
        { ty: 'IMPG', iamt: data.sec_4_a1_igst || 0, camt: 0, samt: 0, csamt: data.sec_4_a1_cess || 0 },
        { ty: 'IMPS', iamt: data.sec_4_a2_igst || 0, camt: 0, samt: 0, csamt: data.sec_4_a2_cess || 0 },
        { ty: 'ISRC', iamt: data.sec_4_a3_igst || 0, camt: data.sec_4_a3_cgst || 0, samt: data.sec_4_a3_sgst || 0, csamt: data.sec_4_a3_cess || 0 },
        { ty: 'ISD', iamt: data.sec_4_a4_igst || 0, camt: data.sec_4_a4_cgst || 0, samt: data.sec_4_a4_sgst || 0, csamt: data.sec_4_a4_cess || 0 },
        { ty: 'OTH', iamt: data.sec_4_a5_igst || 0, camt: data.sec_4_a5_cgst || 0, samt: data.sec_4_a5_sgst || 0, csamt: data.sec_4_a5_cess || 0 },
      ],
      itc_rev: [
        { ty: 'RUL', iamt: data.sec_4_b1_igst || 0, camt: data.sec_4_b1_cgst || 0, samt: data.sec_4_b1_sgst || 0, csamt: data.sec_4_b1_cess || 0 },
        { ty: 'OTH', iamt: data.sec_4_b2_igst || 0, camt: data.sec_4_b2_cgst || 0, samt: data.sec_4_b2_sgst || 0, csamt: data.sec_4_b2_cess || 0 },
      ],
      itc_net: {
        iamt: (data.sec_4_a5_igst || 0) - (data.sec_4_b1_igst || 0) - (data.sec_4_b2_igst || 0),
        camt: (data.sec_4_a5_cgst || 0) - (data.sec_4_b1_cgst || 0) - (data.sec_4_b2_cgst || 0),
        samt: (data.sec_4_a5_sgst || 0) - (data.sec_4_b1_sgst || 0) - (data.sec_4_b2_sgst || 0),
        csamt: (data.sec_4_a5_cess || 0) - (data.sec_4_b1_cess || 0) - (data.sec_4_b2_cess || 0),
      },
    },
  };
}

function parseGSTR2BResponse(response: any, returnId: string, userId: string): any[] {
  const invoices: any[] = [];
  const data = response?.data || response;

  // Parse B2B section
  if (data?.docdata?.b2b) {
    data.docdata.b2b.forEach((supplier: any) => {
      (supplier.inv || []).forEach((inv: any) => {
        (inv.itms || []).forEach((itm: any) => {
          const det = itm.itm_det || {};
          invoices.push({
            return_id: returnId,
            user_id: userId,
            section: 'b2b',
            supplier_gstin: supplier.ctin,
            supplier_name: supplier.trdnm || supplier.ctin,
            invoice_number: inv.inum,
            invoice_date: parseGSTNDate(inv.idt),
            invoice_value: inv.val,
            place_of_supply: inv.pos,
            taxable_value: det.txval || 0,
            igst_amount: det.iamt || 0,
            cgst_amount: det.camt || 0,
            sgst_amount: det.samt || 0,
            cess_amount: det.csamt || 0,
            tax_rate: det.rt || 0,
            itc_eligible: true,
            itc_igst: det.iamt || 0,
            itc_cgst: det.camt || 0,
            itc_sgst: det.samt || 0,
            itc_cess: det.csamt || 0,
          });
        });
      });
    });
  }

  // Parse CDNR section
  if (data?.docdata?.cdnr) {
    data.docdata.cdnr.forEach((supplier: any) => {
      (supplier.nt || []).forEach((note: any) => {
        (note.itms || []).forEach((itm: any) => {
          const det = itm.itm_det || {};
          invoices.push({
            return_id: returnId,
            user_id: userId,
            section: 'cdnr',
            supplier_gstin: supplier.ctin,
            supplier_name: supplier.trdnm || supplier.ctin,
            invoice_number: note.nt_num,
            invoice_date: parseGSTNDate(note.nt_dt),
            invoice_value: note.val,
            place_of_supply: note.pos,
            taxable_value: det.txval || 0,
            igst_amount: det.iamt || 0,
            cgst_amount: det.camt || 0,
            sgst_amount: det.samt || 0,
            cess_amount: det.csamt || 0,
            tax_rate: det.rt || 0,
            itc_eligible: true,
            itc_igst: det.iamt || 0,
            itc_cgst: det.camt || 0,
            itc_sgst: det.samt || 0,
            itc_cess: det.csamt || 0,
          });
        });
      });
    });
  }

  return invoices;
}

function formatDateForGSTN(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
}

function parseGSTNDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert DD-MM-YYYY to YYYY-MM-DD
  }
  return dateStr;
}
