import { useEffect, useRef, useState } from "react";
import { useMarketData } from "./MarketDataContext";
import { WATCHED_INSTRUMENTS } from "./instruments";

const DECIMALS: Record<string, number> = {
  "USD/JPY": 3, "GBP/JPY": 3,
  "XAU/USD": 2,
  "BTC/USD": 2, "ETH/USD": 2,
};

function formatPrice(symbol: string, price: number): string {
  const decimals = DECIMALS[symbol] ?? 5;
  return price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function TickerItem({ symbol }: { symbol: string }) {
  const { prices } = useMarketData();
  const tick = prices[symbol];
  const prevPrice = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!tick) return;
    if (prevPrice.current !== null && tick.price !== prevPrice.current) {
      setFlash(tick.price > prevPrice.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 700);
      prevPrice.current = tick.price;
      return () => clearTimeout(t);
    }
    prevPrice.current = tick.price;
  }, [tick]);

  const instrument = WATCHED_INSTRUMENTS.find((i) => i.symbol === symbol);
  if (!instrument) return null;
return (
  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-200 bg-white shrink-0 shadow hover:shadow-md transition-all duration-300">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{instrument.displayPair}</span>
      {tick ? (
        <span
         className={`text-base font-mono font-bold transition-all duration-300 ${
            flash === "up" ? "text-emerald-600" : flash === "down" ? "text-red-500" : "text-[#111827]"
          }`}
        >
          {formatPrice(symbol, tick.price)}
        </span>
      ) : (
       <span className="text-base font-mono text-slate-300">--.--</span>
      )}
    </div>
  );
}

/** Horizontally-scrolling live ticker for gold, forex majors, and crypto — updates in real time over the market WebSocket. */
export function MarketTicker({ symbols }: { symbols?: string[] }) {
  const { connected } = useMarketData();
  const shown = symbols ?? WATCHED_INSTRUMENTS.map((i) => i.symbol);

return (
  <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-2 px-1">
    <div className="flex items-center gap-2 shrink-0 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-2 text-sm font-semibold">
      <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
    <span className={connected ? "text-emerald-700" : "text-slate-500"}>{connected ? "Live" : "Connecting..."}</span>
      </div>
      {shown.map((symbol) => (
        <TickerItem key={symbol} symbol={symbol} />
      ))}
    </div>
  );
}
