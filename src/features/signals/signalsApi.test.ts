import { describe, it, expect } from "vitest";
import { toUiSignal, type ApiSignal } from "./signalsApi";

function makeSignal(overrides: Partial<ApiSignal> = {}): ApiSignal {
  return {
    id: "sig-1",
    pair: "XAUUSD",
    name: "Gold / USD",
    category: "GOLD",
    status: "RUNNING",
    confidence: 87,
    pips: 45,
    requiredTier: "FREE",
    createdAt: new Date().toISOString(),
    locked: false,
    direction: "BUY",
    entry: "2345.50",
    stopLoss: "2318.00",
    takeProfit1: "2368.00",
    takeProfit2: "2385.00",
    takeProfit3: "2410.00",
    riskPercent: "1.5",
    ...overrides,
  };
}

describe("toUiSignal", () => {
  it("maps category, direction, and status to their display labels", () => {
    const ui = toUiSignal(makeSignal());
    expect(ui.category).toBe("Gold");
    expect(ui.type).toBe("BUY");
    expect(ui.status).toBe("Running");
  });

  it("formats positive pips with a leading + and leaves non-positive pips alone", () => {
    expect(toUiSignal(makeSignal({ pips: 45 })).pips).toBe("+45");
    expect(toUiSignal(makeSignal({ pips: 0 })).pips).toBe("0");
    expect(toUiSignal(makeSignal({ pips: -12 })).pips).toBe("-12");
  });

  it("derives a Low/Medium/High risk level from riskPercent", () => {
    expect(toUiSignal(makeSignal({ riskPercent: "0.5" })).riskLevel).toBe("Low");
    expect(toUiSignal(makeSignal({ riskPercent: "1.2" })).riskLevel).toBe("Medium");
    expect(toUiSignal(makeSignal({ riskPercent: "2.0" })).riskLevel).toBe("High");
  });

  it("shows an honest locked state instead of fabricating entry/SL/TP values", () => {
    const locked = makeSignal({
      locked: true,
      direction: undefined,
      entry: undefined,
      stopLoss: undefined,
      takeProfit1: undefined,
      takeProfit2: undefined,
      takeProfit3: undefined,
      riskPercent: undefined,
    });
    const ui = toUiSignal(locked);
    expect(ui.locked).toBe(true);
    expect(ui.entry).toBe("🔒 Upgrade to view");
    expect(ui.risk).toBe("—");
  });

  it("always shows floatingProfit as a placeholder — no live price feed exists yet", () => {
    expect(toUiSignal(makeSignal()).floatingProfit).toBe("—");
  });
});
