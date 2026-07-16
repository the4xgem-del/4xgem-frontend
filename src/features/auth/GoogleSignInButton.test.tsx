import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { GoogleSignInButton } from "./GoogleSignInButton";

const googleSignIn = vi.fn();

vi.mock("./AuthContext", () => ({
  useAuth: () => ({ googleSignIn }),
}));

vi.mock("./googleSignIn", () => ({
  useGoogleSignInButton: ({ onCredential }: { onCredential: (t: string) => void }) => {
    queueMicrotask(() => onCredential("fake-id-token"));
    return { containerRef: { current: null }, status: "ready" as const };
  },
}));

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    googleSignIn.mockReset();
  });

  it("calls onSuccess when sign-in completes without 2FA", async () => {
    googleSignIn.mockResolvedValue({ twoFactorRequired: false, user: { id: "u1" } });
    const onSuccess = vi.fn();
    const onTwoFactorRequired = vi.fn();
    const onError = vi.fn();

    render(<GoogleSignInButton onSuccess={onSuccess} onTwoFactorRequired={onTwoFactorRequired} onError={onError} />);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onTwoFactorRequired).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(googleSignIn).toHaveBeenCalledWith("fake-id-token");
  });

  it("calls onTwoFactorRequired with the challenge token instead of onSuccess when 2FA is enabled", async () => {
    googleSignIn.mockResolvedValue({ twoFactorRequired: true, challengeToken: "challenge-abc" });
    const onSuccess = vi.fn();
    const onTwoFactorRequired = vi.fn();
    const onError = vi.fn();

    render(<GoogleSignInButton onSuccess={onSuccess} onTwoFactorRequired={onTwoFactorRequired} onError={onError} />);

    await waitFor(() => expect(onTwoFactorRequired).toHaveBeenCalledWith("challenge-abc"));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onError with a friendly message when the backend rejects the token", async () => {
    googleSignIn.mockRejectedValue({
      response: { data: { error: { message: "That Google sign-in couldn't be verified. Please try again." } } },
      isAxiosError: true,
    });
    const onSuccess = vi.fn();
    const onTwoFactorRequired = vi.fn();
    const onError = vi.fn();

    render(<GoogleSignInButton onSuccess={onSuccess} onTwoFactorRequired={onTwoFactorRequired} onError={onError} />);

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onTwoFactorRequired).not.toHaveBeenCalled();
  });
});
