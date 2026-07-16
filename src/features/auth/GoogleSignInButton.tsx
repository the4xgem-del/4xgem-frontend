import { useGoogleSignInButton } from "./googleSignIn";
import { useAuth } from "./AuthContext";
import { getApiErrorMessage } from "@/lib/apiClient";

interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
  onSuccess: () => void;
  onTwoFactorRequired: (challengeToken: string) => void;
  onError: (message: string) => void;
}

export function GoogleSignInButton({ text = "continue_with", onSuccess, onTwoFactorRequired, onError }: GoogleSignInButtonProps) {
  const { googleSignIn } = useAuth();

  const handleCredential = async (idToken: string) => {
    try {
      const result = await googleSignIn(idToken);
      if (result.twoFactorRequired) {
        onTwoFactorRequired(result.challengeToken);
      } else {
        onSuccess();
      }
    } catch (err) {
      onError(getApiErrorMessage(err, "Google sign-in didn't work. Please try again."));
    }
  };

  const { containerRef, status } = useGoogleSignInButton({ onCredential: handleCredential, text });

  if (status === "unavailable") {
    return (
      <div className="w-full border border-dashed border-[#E5E7EB] rounded-2xl py-3 text-center text-xs text-[#9CA3AF]">
        Google Sign-In isn't configured yet
      </div>
    );
  }

  return <div ref={containerRef} className="w-full flex justify-center [&>div]:!w-full" />;
}
