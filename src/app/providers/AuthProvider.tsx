import { useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { AppUser } from "@/types";

type AuthProviderProps = { children: ReactNode };

/**
 * Bootstraps Supabase auth on app load and keeps the store in sync.
 * Wrap the RouterProvider with this so every role layout shares one subscription.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void fetchAndSetProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void fetchAndSetProfile(session.user.id);
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAndSetProfile(userId: string) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const user: AppUser = {
      id: data.id,
      email: authData.user?.email ?? "",
      role: data.role,
      name: data.name,
      phone: data.phone,
      avatar_url: data.avatar_url,
    };
    setUser(user);
  }

  return <>{children}</>;
}
