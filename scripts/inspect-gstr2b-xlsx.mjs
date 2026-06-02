import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const path = "public/DKS - GSTR-2B_MAR'25 - FINAL.xlsx";
const wb = XLSX.read(readFileSync(path));
console.log('sheets:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
  console.log('\n---', name, 'total rows', rows.length);
  rows.slice(0, 12).forEach((r, i) => console.log(i, JSON.stringify(r)));
}
const b2b = XLSX.utils.sheet_to_json(wb.Sheets['B2B'], { header: 1, defval: '' });
const dataRows = b2b.slice(7).filter((r) => r[0] && /^[0-9]{2}[A-Z]/.test(String(r[0])));
console.log('\nB2B invoice count:', dataRows.length);
