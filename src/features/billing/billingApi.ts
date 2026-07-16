import { apiClient, getApiErrorMessage } from "@/lib/apiClient";

export const billingApi = {
  /** Starts a Stripe Checkout flow for the given plan and redirects the browser there. */
  async startCheckout(planId: string): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      const { data } = await apiClient.post<{ data: { url: string } }>("/billing/checkout-session", { planId });
      window.location.href = data.data.url;
      return { ok: true };
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err, "Couldn't start checkout.") };
    }
  },

  /** Opens the Stripe billing portal so the user can manage/cancel their subscription. */
  async openBillingPortal(): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      const { data } = await apiClient.post<{ data: { url: string } }>("/billing/portal-session");
      window.location.href = data.data.url;
      return { ok: true };
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err, "Couldn't open the billing portal.") };
    }
  },
};
