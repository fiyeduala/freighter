import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

/**
 * Auth actions for use within components that are inside RouterProvider.
 * Session bootstrapping lives in AuthProvider (src/app/providers/AuthProvider.tsx).
 */
export function useAuth() {
  const { user, isLoading, logout } = useAuthStore();
  const navigate = useNavigate();

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, name: string, phone: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
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

  return { user, isLoading, signIn, signUp, signOut, resetPassword };
}
