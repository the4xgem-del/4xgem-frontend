export interface InstrumentDef {
  symbol: string; // "EUR/USD"
  displayPair: string; // "EURUSD" — matches TradingSignal.pair
  category: "FOREX" | "GOLD" | "CRYPTO";
  pipSize: number;
}

export const WATCHED_INSTRUMENTS: InstrumentDef[] = [
    { symbol: "XAU/USD", displayPair: "XAUUSD", category: "GOLD", pipSize: 0.1 },
  { symbol: "EUR/USD", displayPair: "EURUSD", category: "FOREX", pipSize: 0.0001 },
  { symbol: "BTC/USD", displayPair: "BTCUSD", category: "CRYPTO", pipSize: 1 },
  { symbol: "GBP/USD", displayPair: "GBPUSD", category: "FOREX", pipSize: 0.0001 },
  { symbol: "USD/JPY", displayPair: "USDJPY", category: "FOREX", pipSize: 0.01 },
  { symbol: "GBP/JPY", displayPair: "GBPJPY", category: "FOREX", pipSize: 0.01 },
  { symbol: "AUD/USD", displayPair: "AUDUSD", category: "FOREX", pipSize: 0.0001 },
  { symbol: "USD/CAD", displayPair: "USDCAD", category: "FOREX", pipSize: 0.0001 },
 { symbol: "ETH/USD", displayPair: "ETHUSD", category: "CRYPTO", pipSize: 0.1 },
];

export function instrumentForPair(displayPair: string): InstrumentDef | undefined {
  const normalized = displayPair.toUpperCase().replace("/", "");
  return WATCHED_INSTRUMENTS.find((i) => i.displayPair === normalized);
}

/** Floating result in pips/points — see the backend's equivalent for why this isn't a dollar amount. */
export function computeFloatingPips(
  pair: string,
  direction: "BUY" | "SELL" | "BUY_LIMIT" | "SELL_LIMIT",
  entry: number,
  currentPrice: number,
): number | null {
  const instrument = instrumentForPair(pair);
  if (!instrument) return null;
  const isLong = direction === "BUY" || direction === "BUY_LIMIT";
  const diff = isLong ? currentPrice - entry : entry - currentPrice;
  return Math.round((diff / instrument.pipSize) * 10) / 10;
}
