export type PairRates = {
  USDTRY: number;
  EURTRY: number;
  USDEUR: number;
  source: 'frankfurter';
  asOf: string;       // YYYY-MM-DD (ECB publish date)
  fetchedAt: number;  // epoch ms
};

const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function fetchRates(): Promise<PairRates> {
  const res = await fetch(`${BACKEND_BASE}/api/rates`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Rates unavailable (${res.status})`);

  const data = await res.json() as { rates?: Record<string, number>; fetchedAt?: string };
  const EURTRY = data?.rates?.TRY;
  const eurusd = data?.rates?.USD;
  if (typeof EURTRY !== 'number' || typeof eurusd !== 'number') {
    throw new Error('Rates unavailable — backend has no data yet');
  }

  const round2 = (n: number) => parseFloat(n.toFixed(2));
  return {
    EURTRY:    round2(EURTRY),
    USDTRY:    round2(EURTRY / eurusd),
    USDEUR:    round2(1 / eurusd),
    source:    'frankfurter',
    asOf:      data.fetchedAt?.slice(0, 10) ?? '',
    fetchedAt: Date.now(),
  };
}
