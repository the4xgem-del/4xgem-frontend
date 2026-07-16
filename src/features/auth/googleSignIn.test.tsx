import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import { useGoogleSignInButton, disableGoogleAutoSelect } from "./googleSignIn";

// Mirrors how GoogleSignInButton actually consumes the hook — a real DOM
// node must be attached to containerRef for the "ready" path to proceed
// (renderButton needs an actual element, same as production usage).
function Harness({ onCredential, text }: { onCredential: (t: string) => void; text?: "signin_with" | "signup_with" | "continue_with" }) {
  const { containerRef, status } = useGoogleSignInButton({ onCredential, text });
  return <div ref={containerRef} data-testid="google-btn-container" data-status={status} />;
}

function getStatus() {
  return screen.getByTestId("google-btn-container").getAttribute("data-status");
}

describe("useGoogleSignInButton", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete (window as { google?: unknown }).google;
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("reports 'unavailable' when no VITE_GOOGLE_CLIENT_ID is configured", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    render(<Harness onCredential={vi.fn()} />);
    await waitFor(() => expect(getStatus()).toBe("unavailable"));
  });

  it("injects the Google Identity Services script tag exactly once", async () => {
    const appendSpy = vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
      const script = node as unknown as HTMLScriptElement;
      queueMicrotask(() => script.onload?.(new Event("load")));
      return node;
    });

    (window as unknown as { google: unknown }).google = {
      accounts: { id: { initialize: vi.fn(), renderButton: vi.fn(), disableAutoSelect: vi.fn() } },
    };

    render(<Harness onCredential={vi.fn()} />);

    await waitFor(() => {
      expect(window.google?.accounts.id.initialize).toHaveBeenCalled();
    });

    appendSpy.mockRestore();
  });

  it("calls initialize with the configured client ID and renderButton once ready", async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    (window as unknown as { google: unknown }).google = {
      accounts: { id: { initialize, renderButton, disableAutoSelect: vi.fn() } },
    };

    const onCredential = vi.fn();
    render(<Harness onCredential={onCredential} text="signin_with" />);

    await waitFor(() => expect(getStatus()).toBe("ready"));

    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "test-client-id.apps.googleusercontent.com" }),
    );
    expect(renderButton).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ text: "signin_with", theme: "outline" }),
    );

    const passedConfig = initialize.mock.calls[0][0];
    passedConfig.callback({ credential: "fake-id-token" });
    expect(onCredential).toHaveBeenCalledWith("fake-id-token");
  });

  it("does not call renderButton when disabled", async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    (window as unknown as { google: unknown }).google = {
      accounts: { id: { initialize, renderButton, disableAutoSelect: vi.fn() } },
    };

    function DisabledHarness() {
      const { containerRef } = useGoogleSignInButton({ onCredential: vi.fn(), disabled: true });
      return <div ref={containerRef} />;
    }
    render(<DisabledHarness />);

    await new Promise((r) => setTimeout(r, 50));
    expect(initialize).not.toHaveBeenCalled();
  });
});

describe("disableGoogleAutoSelect", () => {
  it("calls window.google.accounts.id.disableAutoSelect when available", () => {
    const disableAutoSelect = vi.fn();
    (window as unknown as { google: unknown }).google = { accounts: { id: { disableAutoSelect } } };
    disableGoogleAutoSelect();
    expect(disableAutoSelect).toHaveBeenCalled();
  });

  it("does not throw when Google hasn't loaded", () => {
    delete (window as { google?: unknown }).google;
    expect(() => disableGoogleAutoSelect()).not.toThrow();
  });
});
