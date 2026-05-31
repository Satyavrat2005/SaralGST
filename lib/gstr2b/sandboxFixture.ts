import sampleFixture from './__tests__/fixtures/sample-gstr2b.json';
import { SANDBOX_GSTR2B_PERIOD } from './periodValidation';

export { SANDBOX_GSTR2B_PERIOD };

export function isMasterGstSandboxEnv(): boolean {
  if (process.env.MASTERGST_SANDBOX === 'false') return false;
  return true;
}

export function getSandboxGstr2bPortalResponse(): Record<string, unknown> {
  return sampleFixture as Record<string, unknown>;
}
