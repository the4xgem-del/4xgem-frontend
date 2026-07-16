import { apiClient } from "@/lib/apiClient";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  twoFactorEnabled: boolean;
  role: { name: string };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export type LoginResult =
  | { twoFactorRequired: true; challengeToken: string }
  | { twoFactorRequired: false; user: AuthUser };

export const authApi = {
  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<{ data: AuthUser }>("/auth/me");
    return data.data;
  },

  async login(payload: LoginPayload): Promise<LoginResult> {
    const { data } = await apiClient.post<{ data: { twoFactorRequired: boolean } & Partial<AuthUser> & { challengeToken?: string } }>(
      "/auth/login",
      payload,
    );
    if (data.data.twoFactorRequired) {
      return { twoFactorRequired: true, challengeToken: data.data.challengeToken! };
    }
    const { twoFactorRequired: _omit, ...user } = data.data;
    return { twoFactorRequired: false, user: user as AuthUser };
  },

  async twoFactorLogin(challengeToken: string, code: string): Promise<AuthUser> {
    const { data } = await apiClient.post<{ data: AuthUser }>("/auth/2fa/login-verify", { challengeToken, code });
    return data.data;
  },

  async googleSignIn(idToken: string): Promise<LoginResult> {
    const { data } = await apiClient.post<{ data: { twoFactorRequired: boolean } & Partial<AuthUser> & { challengeToken?: string } }>(
      "/auth/google",
      { idToken },
    );
    if (data.data.twoFactorRequired) {
      return { twoFactorRequired: true, challengeToken: data.data.challengeToken! };
    }
    const { twoFactorRequired: _omit, ...user } = data.data;
    return { twoFactorRequired: false, user: user as AuthUser };
  },

  async register(payload: RegisterPayload): Promise<AuthUser> {
    const { data } = await apiClient.post<{ data: AuthUser }>("/auth/register", payload);
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { token, password });
  },
};
