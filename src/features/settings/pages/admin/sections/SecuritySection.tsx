import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Monitor, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";

export function SecuritySection() {
  const { data: session, isLoading } = useQuery({
    queryKey: ["auth_session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Current session</CardTitle>
          <CardDescription>
            Your active login session. Sign out from the avatar menu to end it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : session ? (
            <div className="flex items-start gap-3 rounded-md border p-4">
              <Monitor className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">This device</p>
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Signed in · expires{" "}
                  {formatDateTime(new Date(session.expires_at! * 1000).toISOString())}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active session found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            2FA adds an extra layer of security. Enforcement and setup coming in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-md border p-4">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Authenticator app</p>
              <p className="text-xs text-muted-foreground">2FA not yet configured.</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Set up 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password policy</CardTitle>
          <CardDescription>
            Minimum password requirements enforced by Supabase Auth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {[
              "Minimum 8 characters",
              "No maximum length",
              "Email verification required on sign-up",
              "Password reset via email link",
            ].map((rule) => (
              <li key={rule} className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
