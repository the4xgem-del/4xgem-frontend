import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthUser, type LoginPayload, type RegisterPayload, type LoginResult } from "./authApi";
import { getApiErrorMessage } from "@/lib/apiClient";
import { disableGoogleAutoSelect } from "./googleSignIn";

interface AuthContextValue {
  user: AuthUser | null | undefined; // undefined = still loading
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  loginError: string | null;
  isLoggingIn: boolean;
  twoFactorLogin: (challengeToken: string, code: string) => Promise<AuthUser>;
  twoFactorLoginError: string | null;
  isVerifyingTwoFactor: boolean;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  registerError: string | null;
  isRegistering: boolean;
  googleSignIn: (idToken: string) => Promise<LoginResult>;
  googleSignInError: string | null;
  isGoogleSigningIn: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
    // A 401 here just means "not logged in" — not an error state to surface.
    throwOnError: false,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      if (!result.twoFactorRequired) queryClient.setQueryData(ME_QUERY_KEY, result.user);
    },
  });

  const twoFactorLoginMutation = useMutation({
    mutationFn: ({ challengeToken, code }: { challengeToken: string; code: string }) =>
      authApi.twoFactorLogin(challengeToken, code),
    onSuccess: (user) => queryClient.setQueryData(ME_QUERY_KEY, user),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
  });

  const googleSignInMutation = useMutation({
    mutationFn: authApi.googleSignIn,
    onSuccess: (result) => {
      if (!result.twoFactorRequired) queryClient.setQueryData(ME_QUERY_KEY, result.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      // Prevents Google from silently auto-signing the same account back in
      // (One Tap / auto-select) on the next visit after an explicit logout.
      disableGoogleAutoSelect();
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.isLoading ? undefined : meQuery.data ?? null,
      isAuthenticated: Boolean(meQuery.data),
      isLoading: meQuery.isLoading,
      login: (payload) => loginMutation.mutateAsync(payload),
      loginError: loginMutation.error ? getApiErrorMessage(loginMutation.error) : null,
      isLoggingIn: loginMutation.isPending,
      twoFactorLogin: (challengeToken, code) => twoFactorLoginMutation.mutateAsync({ challengeToken, code }),
      twoFactorLoginError: twoFactorLoginMutation.error ? getApiErrorMessage(twoFactorLoginMutation.error) : null,
      isVerifyingTwoFactor: twoFactorLoginMutation.isPending,
      register: (payload) => registerMutation.mutateAsync(payload),
      registerError: registerMutation.error ? getApiErrorMessage(registerMutation.error) : null,
      isRegistering: registerMutation.isPending,
      googleSignIn: (idToken) => googleSignInMutation.mutateAsync(idToken),
      googleSignInError: googleSignInMutation.error ? getApiErrorMessage(googleSignInMutation.error) : null,
      isGoogleSigningIn: googleSignInMutation.isPending,
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [
      meQuery.isLoading,
      meQuery.data,
      loginMutation,
      twoFactorLoginMutation,
      registerMutation,
      googleSignInMutation,
      logoutMutation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
