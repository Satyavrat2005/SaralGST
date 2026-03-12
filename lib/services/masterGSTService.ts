// MasterGST API Service (Whitebooks Sandbox)
// Base URL: https://apisandbox.whitebooks.in
// Authentication: /authentication/otprequest, /authentication/authtoken
// GSTR APIs: /gstr1, /gstr2b, /gstr3b, /gstr

const MASTERGST_BASE = 'https://apisandbox.whitebooks.in';

// Hardcoded credentials as per user requirement
export const MASTERGST_CONFIG = {
  client_id: 'GSTSe595dac1-0fc5-4214-ac7c-7bd8e06181e5',
  client_secret: 'GSTS0a145966-eced-41fc-b820-b58879c6278e',
  gst_username: 'MH_NT2.1641',
  gstin: '27AAGCB1286Q1Z4',
  state_cd: '27', // Maharashtra - must match first 2 digits of GSTIN
  email: 'khatigaurav8@gmail.com', // Default email for API calls
  ip_address: '127.0.0.1',
};

// State code mapping
const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
  '37': 'Andhra Pradesh',
};

export function getStateName(code: string): string {
  return STATE_CODES[code] || code;
}

// Base headers for ALL API calls (auth + data)
function getBaseHeaders(): Record<string, string> {
  return {
    'client_id': MASTERGST_CONFIG.client_id,
    'client_secret': MASTERGST_CONFIG.client_secret,
    'gst_username': MASTERGST_CONFIG.gst_username,
    'state_cd': MASTERGST_CONFIG.state_cd,
    'ip_address': MASTERGST_CONFIG.ip_address,
    'Content-Type': 'application/json',
  };
}

// Headers for authentication endpoints — NO gstin header per API docs
function getAuthHeaders(txn?: string): Record<string, string> {
  const headers = getBaseHeaders();
  if (txn) headers['txn'] = txn;
  return headers;
}

// Headers for data endpoints (GSTR1/2B/3B) — includes gstin + txn
function getDataHeaders(txn: string): Record<string, string> {
  const headers = getBaseHeaders();
  headers['txn'] = txn;
  headers['gstin'] = MASTERGST_CONFIG.gstin;
  return headers;
}

// Build query string from params
function buildQuery(params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return searchParams.toString();
}

// Helper to parse API responses (handles various response formats from Whitebooks sandbox)
function isSuccessResponse(data: any): boolean {
  return data.status_cd === '1' || data.status_cd === 1 || data.status === 'Success' || data.status === 1 || data.success === true;
}

function getErrorMessage(data: any): string {
  return data.error?.message || data.error?.msg || data.message || data.error_description || data.error || 
    (typeof data.data === 'string' ? data.data : '') || 'API request failed';
}

// ================== AUTHENTICATION ==================

export async function requestOTP(): Promise<{ success: boolean; txn?: string; error?: string; rawResponse?: any }> {
  try {
    const query = buildQuery({ email: MASTERGST_CONFIG.email });
    const url = `${MASTERGST_BASE}/authentication/otprequest?${query}`;
    console.log('[MasterGST] OTP Request URL:', url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const text = await res.text();
    console.log('[MasterGST] OTP Response status:', res.status, 'body:', text.substring(0, 500));
    
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: `Invalid response from API (status ${res.status}): ${text.substring(0, 200)}` };
    }
    
    if (isSuccessResponse(data)) {
      const txn = data.data?.txn || data.txn || data.header?.txn;
      return { success: true, txn, rawResponse: data };
    }
    return { success: false, error: getErrorMessage(data), rawResponse: data };
  } catch (err: any) {
    console.error('[MasterGST] OTP Request error:', err);
    return { success: false, error: `Connection failed: ${err.message}` };
  }
}

export async function getAuthToken(otp: string, txn: string): Promise<{ success: boolean; authToken?: string; txn?: string; error?: string; rawResponse?: any }> {
  try {
    const query = buildQuery({ email: MASTERGST_CONFIG.email, otp });
    const headers = getAuthHeaders(txn);
    const url = `${MASTERGST_BASE}/authentication/authtoken?${query}`;
    console.log('[MasterGST] Auth Token URL:', url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const text = await res.text();
    console.log('[MasterGST] Auth Token Response status:', res.status, 'body:', text.substring(0, 500));
    
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: `Invalid response from API (status ${res.status}): ${text.substring(0, 200)}` };
    }
    
    if (isSuccessResponse(data)) {
      const authToken = data.data?.auth_token || data.auth_token || data.data?.authtoken;
      const resTxn = data.data?.txn || data.txn || txn;
      return { success: true, authToken, txn: resTxn, rawResponse: data };
    }
    return { success: false, error: getErrorMessage(data), rawResponse: data };
  } catch (err: any) {
    console.error('[MasterGST] Auth Token error:', err);
    return { success: false, error: `Connection failed: ${err.message}` };
  }
}

// ================== GSTR-1 APIs ==================

export async function getGSTR1Summary(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      retperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr1/retsum?${query}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function getGSTR1B2B(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      retperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr1/b2b?${query}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function saveGSTR1(retPeriod: string, txn: string, payload: any) {
  try {
    const query = buildQuery({ email: MASTERGST_CONFIG.email });
    const headers = getDataHeaders(txn);
    headers['ret_period'] = retPeriod;
    const res = await fetch(`${MASTERGST_BASE}/gstr1/retsave?${query}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function submitGSTR1(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      retperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr1/retsubmit?${query}`, {
      method: 'POST',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function fileGSTR1(retPeriod: string, txn: string, pan: string, otp: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      retperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
      pan,
      otp,
    });
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr1/retfile?${query}`, {
      method: 'POST',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

// ================== GSTR-2B APIs ==================

export async function getGSTR2B(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      rtnprd: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getDataHeaders(txn);
    console.log('[MasterGST] GSTR2B fetch URL:', `${MASTERGST_BASE}/gstr2b/all?${query}`);
    console.log('[MasterGST] GSTR2B headers:', JSON.stringify({ ...headers, client_secret: '***' }));
    const res = await fetch(`${MASTERGST_BASE}/gstr2b/all?${query}`, {
      method: 'GET',
      headers,
    });
    const text = await res.text();
    console.log('[MasterGST] GSTR2B response status:', res.status, 'body:', text.substring(0, 500));
    try { return JSON.parse(text); } catch { return { error: true, message: `Invalid response (${res.status}): ${text.substring(0, 200)}` }; }
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function generateGSTR2BOnDemand(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({ email: MASTERGST_CONFIG.email });
    const headers = getDataHeaders(txn);
    headers['ret_period'] = retPeriod;
    const payload = {
      rtin: MASTERGST_CONFIG.gstin,
      itcprd: retPeriod,
    };
    const res = await fetch(`${MASTERGST_BASE}/gstr2b/gen2b?${query}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log('[MasterGST] GSTR2B generate response status:', res.status, 'body:', text.substring(0, 500));
    try { return JSON.parse(text); } catch { return { error: true, message: `Invalid response (${res.status}): ${text.substring(0, 200)}` }; }
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function getGSTR2BSummary(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      rtnprd: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr2b/retsum?${query}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

// ================== GSTR-3B APIs ==================

export async function getGSTR3BSummary(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      retperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr3b/retsum?${query}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function saveGSTR3B(retPeriod: string, txn: string, payload: any) {
  try {
    const query = buildQuery({ email: MASTERGST_CONFIG.email });
    const headers = getDataHeaders(txn);
    headers['ret_period'] = retPeriod;
    const res = await fetch(`${MASTERGST_BASE}/gstr3b/retsave?${query}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function submitGSTR3B(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      retperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr3b/retsubmit?${query}`, {
      method: 'POST',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

// ================== COMMON APIs ==================

export async function getReturnStatus(retPeriod: string, refId: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      returnperiod: retPeriod,
      refid: refId,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr/retstatus?${query}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function viewAndTrackReturns(retPeriod: string, txn: string, returnType?: string) {
  try {
    const params: Record<string, string> = {
      gstin: MASTERGST_CONFIG.gstin,
      returnperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
    };
    if (returnType) params['type'] = returnType;
    const query = buildQuery(params);
    const headers = getDataHeaders(txn);
    const res = await fetch(`${MASTERGST_BASE}/gstr/rettrack?${query}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function searchTaxpayer(gstin: string) {
  try {
    const query = buildQuery({
      email: MASTERGST_CONFIG.email,
      gstin,
    });
    const headers: Record<string, string> = {
      'client_id': MASTERGST_CONFIG.client_id,
      'client_secret': MASTERGST_CONFIG.client_secret,
    };
    const res = await fetch(`${MASTERGST_BASE}/public/search?${query}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

// ================== HELPER: Format return period ==================

export function formatReturnPeriod(month: number, year: number): string {
  return `${month.toString().padStart(2, '0')}${year}`;
}

export function parseReturnPeriod(period: string): { month: number; year: number } {
  return {
    month: parseInt(period.substring(0, 2)),
    year: parseInt(period.substring(2)),
  };
}

export function getFinancialYear(month: number, year: number): string {
  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(2)}`;
  }
  return `${year - 1}-${year.toString().slice(2)}`;
}

export function getReturnPeriodLabel(period: string): string {
  const { month, year } = parseReturnPeriod(period);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1]} ${year}`;
}

// Get available filing periods (last 12 months)
export function getAvailablePeriods(): { label: string; value: string }[] {
  const periods = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    periods.push({
      label: `${d.toLocaleDateString('en-US', { month: 'long' })} ${year}`,
      value: formatReturnPeriod(month, year),
    });
  }
  return periods;
}
