import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/useAuth";

const RESEND_COOLDOWN = 60;

export function VerifyEmailPage() {
  const { resendVerification } = useAuth();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await resendVerification(email);
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend — try again shortly");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              {resent ? (
                <CheckCircle className="h-7 w-7 text-primary" />
              ) : (
                <Mail className="h-7 w-7 text-primary" />
              )}
            </div>
            <CardTitle>{resent ? "Email sent again" : "Check your email"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-center">
            {email ? (
              <p className="text-sm text-muted-foreground">
                We sent a verification link to{" "}
                <span className="font-medium text-foreground">{email}</span>. Click the link to
                activate your account.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                We sent a verification link to your email address. Click the link to activate your
                account.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Check your spam folder if you don&apos;t see it within a few minutes.
            </p>

            {email && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={isResending || cooldown > 0}
              >
                {isResending && <Loader2 className="animate-spin" />}
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : isResending
                    ? "Sending…"
                    : "Resend verification email"}
              </Button>
            )}

            <Button variant="ghost" asChild className="w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
