import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Linking } from "react-native";
import { supabase } from "../services/supabase";
import { setActiveOrganizationId } from "../services/API";

export type FixarRole = "owner" | "admin" | "technician" | "viewer";
export interface FixarOrganization {
  id: string; name: string; legal_name: string | null; document: string | null;
  email: string | null; phone: string | null; address: string | null; logo_path?: string | null;
}
export interface FixarSession {
  user: { id: string; name: string; email: string };
  organization: FixarOrganization;
  role: FixarRole;
}
interface AuthContextData {
  session: FixarSession | null;
  authenticatedUser: User | null;
  needsOrganization: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<void>;
  createOrganization: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
const AuthContext = createContext<AuthContextData>({} as AuthContextData);
const AUTH_REDIRECT_URL = "fixar://auth/callback";

async function handleAuthCallback(url: string) {
  if (!url.startsWith(AUTH_REDIRECT_URL)) return;
  const parameters = new URLSearchParams(url.split("#")[1] ?? url.split("?")[1] ?? "");
  const accessToken = parameters.get("access_token");
  const refreshToken = parameters.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  }
}

function errorMessage(error: { message?: string } | null, fallback: string) {
  if (!error?.message) return fallback;
  if (error.message === "Invalid login credentials") return "E-mail ou senha inválidos.";
  if (error.message.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (error.message.includes("already registered")) return "Este e-mail já está cadastrado.";
  return error.message;
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<FixarSession | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [needsOrganization, setNeedsOrganization] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadApplicationSession(user: User | null) {
    setAuthenticatedUser(user);
    if (!user) {
      setActiveOrganizationId(null);
      setSession(null);
      setNeedsOrganization(false);
      return;
    }
    const { data, error } = await supabase.from("organization_members")
      .select("organization_id, role, Organization:organizations(id, name, legal_name, document, email, phone, address, logo_path)")
      .eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
    if (error) throw new Error(errorMessage(error, "Não foi possível carregar sua empresa."));
    if (!data) {
      setActiveOrganizationId(null);
      setSession(null);
      setNeedsOrganization(true);
      return;
    }
    const organization = data.Organization as unknown as FixarOrganization;
    const nextSession: FixarSession = {
      user: {
        id: user.id,
        name: String(user.user_metadata?.display_name || user.email?.split("@")[0] || "Usuário"),
        email: user.email ?? "",
      },
      organization,
      role: data.role as FixarRole,
    };
    setActiveOrganizationId(organization.id);
    setSession(nextSession);
    setNeedsOrganization(false);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      try { await loadApplicationSession(data.session?.user ?? null); }
      finally { if (mounted) setLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setTimeout(() => {
        loadApplicationSession(authSession?.user ?? null).catch(() => {
          setSession(null);
          setNeedsOrganization(Boolean(authSession?.user));
        });
      }, 0);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthCallback(url).catch(() => undefined);
    });
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleAuthCallback(url).catch(() => undefined);
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo<AuthContextData>(() => ({
    session, authenticatedUser, needsOrganization, loading,
    async signIn(email, password) {
      if (!email.trim() || !password.trim()) throw new Error("Informe e-mail e senha.");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password,
      });
      if (error) throw new Error(errorMessage(error, "Não foi possível entrar."));
      await loadApplicationSession(data.user);
    },
    async signUp(name, email, password) {
      if (!name.trim() || !email.trim() || password.length < 6) {
        throw new Error("Informe nome, e-mail e uma senha com pelo menos 6 caracteres.");
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: {
          emailRedirectTo: AUTH_REDIRECT_URL,
          data: { display_name: name.trim() },
        },
      });
      if (error) throw new Error(errorMessage(error, "Não foi possível criar a conta."));
      if (data.session) await loadApplicationSession(data.user);
      return Boolean(data.session);
    },
    async resendConfirmation(email) {
      if (!email.trim()) throw new Error("Informe o e-mail da conta.");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: AUTH_REDIRECT_URL },
      });
      if (error) throw new Error(errorMessage(error, "Não foi possível reenviar a confirmação."));
    },
    async createOrganization(name) {
      if (!name.trim()) throw new Error("Informe o nome da empresa.");
      const { error } = await supabase.from("organizations").insert({ name: name.trim() });
      if (error) throw new Error(errorMessage(error, "Não foi possível criar a empresa."));
      const { data } = await supabase.auth.getUser();
      await loadApplicationSession(data.user);
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(errorMessage(error, "Não foi possível sair."));
      await loadApplicationSession(null);
    },
    async refreshSession() {
      const { data } = await supabase.auth.getUser();
      await loadApplicationSession(data.user);
    },
  }), [authenticatedUser, loading, needsOrganization, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
