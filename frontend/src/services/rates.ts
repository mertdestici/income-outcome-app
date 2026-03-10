export type PairRates = {
  USDTRY: number;
  EURTRY: number;
  USDEUR: number;
  source: 'frankfurter';
  asOf: string;       // YYYY-MM-DD (ECB publish date)
  fetchedAt: number;  // epoch ms
};

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/**
 * Fetch exchange rates from the backend cache (sourced from ECB via Frankfurter).
 * Backend returns: { base: "EUR", rates: { TRY, USD }, fetchedAt: ISO instant }
 */
export async function fetchRates(): Promise<PairRates> {
  const res = await fetch(`${BASE}/api/rates`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Rates fetch failed: ${res.status}`);
  const data = await res.json() as { base: string; rates: Record<string, number>; fetchedAt: string };

  const EURTRY = data?.rates?.TRY;
  const eurusd = data?.rates?.USD;  // 1 EUR = X USD
  if (typeof EURTRY !== 'number' || typeof eurusd !== 'number') {
    throw new Error('Unexpected rates payload');
  }

  // Derive pair rates from EUR base:
  // 1 USD = EURTRY / eurusd TRY
  // 1 USD = 1 / eurusd EUR
  const round2 = (n: number) => parseFloat(n.toFixed(2));
  const asOf = data.fetchedAt ? data.fetchedAt.slice(0, 10) : '';

  return {
    EURTRY: round2(EURTRY),
    USDTRY: round2(EURTRY / eurusd),
    USDEUR: round2(1 / eurusd),
    source: 'frankfurter',
    asOf,
    fetchedAt: Date.now(),
  };
}
