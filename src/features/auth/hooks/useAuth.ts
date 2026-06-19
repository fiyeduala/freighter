import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

/**
 * Auth actions for use within components that are inside RouterProvider.
 * Session bootstrapping lives in AuthProvider (src/app/providers/AuthProvider.tsx).
 */
export function useAuth() {
  const { user, isLoading, logout, setUser } = useAuthStore();
  const navigate = useNavigate();

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(
    email: string,
    password: string,
    name: string,
    phone: string,
    options?: { role?: string; inviteToken?: string },
  ) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role: options?.role ?? "customer",
          ...(options?.inviteToken ? { invite_token: options.inviteToken } : {}),
        },
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    logout();
    navigate("/login");
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }

  async function resendVerification(email: string) {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
  }

  async function completeOnboarding() {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);
    if (error) throw error;
    setUser({ ...user, onboarding_complete: true });
  }

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
    completeOnboarding,
  };
}
