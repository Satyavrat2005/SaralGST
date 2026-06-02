export const DKS_MARCH_PERIOD = '032025';
export const DKS_RECON_RETURN_ID = 'dks-mar25-recon';

export function isDksMarchPeriod(period: string): boolean {
  return period === DKS_MARCH_PERIOD;
}
