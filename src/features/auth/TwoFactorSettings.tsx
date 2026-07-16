import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { twoFactorApi, getApiErrorMessage } from "./twoFactorApi";

type Step = "idle" | "enrolling" | "recovery-codes" | "disabling" | "regenerating";

export function TwoFactorSettings({ isEnabled }: { isEnabled: boolean }) {
  const queryClient = useQueryClient();
  const refreshMe = () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

  const [step, setStep] = useState<Step>("idle");
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const reset = () => {
    setStep("idle");
    setSetupData(null);
    setRecoveryCodes(null);
    setCode("");
    setPassword("");
    setError(null);
  };

  const startSetup = async () => {
    setError(null);
    setIsBusy(true);
    try {
      const result = await twoFactorApi.setup();
      setSetupData({ secret: result.secret, qrCodeDataUrl: result.qrCodeDataUrl });
      setStep("enrolling");
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't start 2FA setup."));
    } finally {
      setIsBusy(false);
    }
  };

  const confirmSetup = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      const result = await twoFactorApi.confirm(code);
      setRecoveryCodes(result.recoveryCodes);
      setStep("recovery-codes");
      refreshMe();
    } catch (err) {
      setError(getApiErrorMessage(err, "That code isn't valid."));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!password) {
      setError("Enter your password to disable 2FA.");
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      await twoFactorApi.disable(password);
      reset();
      refreshMe();
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't disable 2FA."));
    } finally {
      setIsBusy(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    if (!password) {
      setError("Enter your password to regenerate recovery codes.");
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      const result = await twoFactorApi.regenerateRecoveryCodes(password);
      setRecoveryCodes(result.recoveryCodes);
      setStep("recovery-codes");
      setPassword("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't regenerate recovery codes."));
    } finally {
      setIsBusy(false);
    }
  };

  if (step === "recovery-codes" && recoveryCodes) {
    return (
      <div className="py-2">
        <p className="text-sm font-semibold text-[#111827] mb-1">Save your recovery codes</p>
        <p className="text-xs text-[#6B7280] mb-3">
          Each code can be used once to sign in if you lose access to your authenticator app. Store them somewhere safe — they won't be shown again.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3 font-mono text-xs bg-[#F8FAFC] rounded-xl p-3 border border-[#E5E7EB]">
          {recoveryCodes.map((c) => <div key={c} className="text-[#111827]">{c}</div>)}
        </div>
        <button onClick={reset} className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-1.5 rounded-lg">
          I've saved these codes
        </button>
      </div>
    );
  }

  if (step === "enrolling" && setupData) {
    return (
      <div className="py-2">
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <p className="text-sm text-[#6B7280] mb-3">Scan this QR code with Google Authenticator, Authy, or any TOTP app — then enter the 6-digit code it shows.</p>
        <img src={setupData.qrCodeDataUrl} alt="2FA QR code" className="w-40 h-40 rounded-xl border border-[#E5E7EB] mb-2" />
        <p className="text-xs text-[#6B7280] mb-3">
          Can't scan? Enter this key manually: <span className="font-mono font-semibold text-[#111827]">{setupData.secret}</span>
        </p>
        <div className="flex items-center gap-2">
          <input
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-32 px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm font-mono text-center tracking-widest"
          />
          <button onClick={confirmSetup} disabled={isBusy} className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 px-3 py-2 rounded-lg">
            {isBusy ? "Verifying..." : "Enable 2FA"}
          </button>
          <button onClick={reset} className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] px-2">Cancel</button>
        </div>
      </div>
    );
  }

  if (step === "disabling" || step === "regenerating") {
    return (
      <div className="py-2">
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <p className="text-sm text-[#6B7280] mb-2">
          {step === "disabling" ? "Confirm your password to disable two-factor authentication." : "Confirm your password to generate new recovery codes (old ones stop working)."}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 max-w-[220px] px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm"
          />
          <button
            onClick={step === "disabling" ? handleDisable : handleRegenerateRecoveryCodes}
            disabled={isBusy}
            className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-3 py-2 rounded-lg"
          >
            {isBusy ? "Confirming..." : step === "disabling" ? "Disable 2FA" : "Regenerate"}
          </button>
          <button onClick={reset} className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] px-2">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]">
      <span className="text-sm text-[#6B7280]">
        Two-Factor Authentication: {isEnabled ? <span className="text-emerald-600 font-semibold">Enabled</span> : "Disabled"}
      </span>
      {isEnabled ? (
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("regenerating")} className="text-xs font-semibold text-[#2563EB] hover:underline">Regenerate codes</button>
          <button onClick={() => setStep("disabling")} className="text-xs font-semibold text-red-600 hover:underline">Disable</button>
        </div>
      ) : (
        <button onClick={startSetup} disabled={isBusy} className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 px-3 py-1.5 rounded-lg">
          {isBusy ? "Loading..." : "Enable"}
        </button>
      )}
    </div>
  );
}
