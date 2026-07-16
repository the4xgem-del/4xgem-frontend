import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TwoFactorSettings } from "./TwoFactorSettings";

vi.mock("./twoFactorApi", () => ({
  twoFactorApi: {
    setup: vi.fn().mockResolvedValue({ secret: "JBSWY3DPEHPK3PXP", otpauthUrl: "otpauth://totp/x", qrCodeDataUrl: "data:image/png;base64,fake" }),
    confirm: vi.fn().mockResolvedValue({ recoveryCodes: ["AAAA-BBBB-CCCC", "DDDD-EEEE-FFFF"] }),
    disable: vi.fn().mockResolvedValue(undefined),
    regenerateRecoveryCodes: vi.fn().mockResolvedValue({ recoveryCodes: ["1111-2222-3333"] }),
  },
  getApiErrorMessage: (_err: unknown, fallback: string) => fallback,
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("TwoFactorSettings", () => {
  it("shows 'Disabled' and an Enable button when 2FA is off", () => {
    renderWithClient(<TwoFactorSettings isEnabled={false} />);
    expect(screen.getByText(/Disabled/)).toBeInTheDocument();
    expect(screen.getByText("Enable")).toBeInTheDocument();
  });

  it("shows 'Enabled' with Disable/Regenerate actions when 2FA is on", () => {
    renderWithClient(<TwoFactorSettings isEnabled={true} />);
    expect(screen.getByText(/Enabled/)).toBeInTheDocument();
    expect(screen.getByText("Disable")).toBeInTheDocument();
    expect(screen.getByText("Regenerate codes")).toBeInTheDocument();
  });

  it("walks through enroll -> QR shown -> confirm -> recovery codes shown", async () => {
    renderWithClient(<TwoFactorSettings isEnabled={false} />);

    fireEvent.click(screen.getByText("Enable"));
    await waitFor(() => expect(screen.getByAltText("2FA QR code")).toBeInTheDocument());
    expect(screen.getByText(/JBSWY3DPEHPK3PXP/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "123456" } });
    fireEvent.click(screen.getByText("Enable 2FA"));

    await waitFor(() => expect(screen.getByText("Save your recovery codes")).toBeInTheDocument());
    expect(screen.getByText("AAAA-BBBB-CCCC")).toBeInTheDocument();
    expect(screen.getByText("DDDD-EEEE-FFFF")).toBeInTheDocument();

    fireEvent.click(screen.getByText("I've saved these codes"));
    await waitFor(() => expect(screen.queryByText("Save your recovery codes")).not.toBeInTheDocument());
  });

  it("requires a password before disabling", async () => {
    renderWithClient(<TwoFactorSettings isEnabled={true} />);
    fireEvent.click(screen.getByText("Disable"));
    fireEvent.click(screen.getByText("Disable 2FA"));
    await waitFor(() => expect(screen.getByText(/Enter your password/)).toBeInTheDocument());
  });
});
