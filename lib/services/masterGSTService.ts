// MasterGST API Service
// Base URL: https://api.mastergst.com/public for public APIs
// Authenticated APIs: https://api.mastergst.com/gstr1, /gstr2b, /gstr3b, /gstr, /authentication

const MASTERGST_BASE = 'https://api.mastergst.com';

// Hardcoded credentials as per user requirement
const MASTERGST_CONFIG = {
  client_id: 'GSTSe595dac1-0fc5-4214-ac7c-7bd8e06181e5',
  client_secret: 'GSTS0a145966-eced-41fc-b820-b58879c6278e',
  gst_username: 'TN_NT2.152383',
  gstin: '33AAGCB1286Q1ZB',
  state_cd: '33', // Tamil Nadu
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

// Common headers for all API calls
function getCommonHeaders(authToken?: string, txn?: string) {
  const headers: Record<string, string> = {
    'client_id': MASTERGST_CONFIG.client_id,
    'client_secret': MASTERGST_CONFIG.client_secret,
    'gst_username': MASTERGST_CONFIG.gst_username,
    'state_cd': MASTERGST_CONFIG.state_cd,
    'ip_address': MASTERGST_CONFIG.ip_address,
    'Content-Type': 'application/json',
  };
  if (authToken) headers['txn'] = txn || '';
  if (MASTERGST_CONFIG.gstin) headers['gstin'] = MASTERGST_CONFIG.gstin;
  return headers;
}

// Build query string from params
function buildQuery(params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return searchParams.toString();
}

// ================== AUTHENTICATION ==================

export async function requestOTP(): Promise<{ success: boolean; txn?: string; error?: string }> {
  try {
    const query = buildQuery({ email: MASTERGST_CONFIG.email });
    const res = await fetch(`${MASTERGST_BASE}/authentication/otprequest?${query}`, {
      method: 'GET',
      headers: getCommonHeaders(),
    });
    const data = await res.json();
    if (data.status_cd === '1' || data.status_cd === 1) {
      return { success: true, txn: data.data?.txn || data.txn };
    }
    return { success: false, error: data.error?.message || 'OTP request failed' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAuthToken(otp: string, txn: string): Promise<{ success: boolean; authToken?: string; txn?: string; error?: string }> {
  try {
    const query = buildQuery({ email: MASTERGST_CONFIG.email, otp });
    const headers = getCommonHeaders();
    headers['txn'] = txn;
    const res = await fetch(`${MASTERGST_BASE}/authentication/authtoken?${query}`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (data.status_cd === '1' || data.status_cd === 1) {
      return { success: true, authToken: data.data?.auth_token, txn: data.data?.txn || txn };
    }
    return { success: false, error: data.error?.message || 'Auth token failed' };
  } catch (err: any) {
    return { success: false, error: err.message };
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
      retperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
    const res = await fetch(`${MASTERGST_BASE}/gstr2b/getall?${query}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { error: true, message: err.message };
  }
}

export async function getGSTR2BSummary(retPeriod: string, txn: string) {
  try {
    const query = buildQuery({
      gstin: MASTERGST_CONFIG.gstin,
      retperiod: retPeriod,
      email: MASTERGST_CONFIG.email,
    });
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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
    const headers = getCommonHeaders(undefined, txn);
    headers['txn'] = txn;
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

export { MASTERGST_CONFIG };
