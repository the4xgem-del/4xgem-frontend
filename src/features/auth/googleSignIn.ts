import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "square" | "circle";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            },
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let scriptLoadPromise: Promise<void> | null = null;

/** Loads the Google Identity Services script exactly once, however many components need it. */
function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

interface UseGoogleSignInOptions {
  onCredential: (idToken: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  disabled?: boolean;
}

/**
 * Renders the real, Google-branded "Continue with Google" button into the
 * returned ref's element and calls `onCredential` with the ID token once
 * the user completes sign-in. Google restricts customizing their button's
 * visual design (branding requirement), so this renders their actual
 * button rather than faking one — sized/themed to fit the surrounding UI
 * as closely as their API allows.
 */
export function useGoogleSignInButton({ onCredential, text = "continue_with", disabled }: UseGoogleSignInOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  console.log("GOOGLE CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!clientId) {
      setStatus("unavailable");
      return;
    }
    if (disabled) return;

    let cancelled = false;

    loadGoogleIdentityServices()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredential(response.credential),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          width: containerRef.current.offsetWidth || 320,
        });
        setStatus("ready");
      })
      .catch(() => setStatus("unavailable"));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, disabled]);

  return { containerRef, status };
}

/** Call on logout so a subsequent visit doesn't auto-select the previous Google session. */
export function disableGoogleAutoSelect(): void {
  window.google?.accounts?.id?.disableAutoSelect();
}
