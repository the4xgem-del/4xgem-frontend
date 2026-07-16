import { apiClient, getApiErrorMessage } from "@/lib/apiClient";

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export const twoFactorApi = {
  async setup(): Promise<TotpSetupResult> {
    const { data } = await apiClient.post<{ data: TotpSetupResult }>("/auth/2fa/setup");
    return data.data;
  },
  async confirm(token: string): Promise<{ recoveryCodes: string[] }> {
    const { data } = await apiClient.post<{ data: { recoveryCodes: string[] } }>("/auth/2fa/confirm", { token });
    return data.data;
  },
  async disable(password: string): Promise<void> {
    await apiClient.post("/auth/2fa/disable", { password });
  },
  async regenerateRecoveryCodes(password: string): Promise<{ recoveryCodes: string[] }> {
    const { data } = await apiClient.post<{ data: { recoveryCodes: string[] } }>("/auth/2fa/recovery-codes", { password });
    return data.data;
  },
};

export { getApiErrorMessage };
