import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, MailCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn, resendVerification, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) {
    const dashboardPath =
      user.role === "admin" ? "/admin" : user.role === "customer" ? "/app" : "/driver";
    return <Navigate to={dashboardPath} replace />;
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setUnverifiedEmail(null);
    try {
      await signIn(data.email, data.password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      if (
        msg.toLowerCase().includes("not confirmed") ||
        msg.toLowerCase().includes("not verified")
      ) {
        setUnverifiedEmail(data.email);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      await resendVerification(unverifiedEmail);
      toast.success("Verification email sent — check your inbox");
    } catch {
      toast.error("Failed to resend — try again shortly");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Freighter</h1>
          <p className="text-sm text-muted-foreground">Logistics Management Platform</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your credentials to access your workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {unverifiedEmail && (
              <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Email not verified
                  </p>
                  <p className="text-amber-700 dark:text-amber-400">
                    Check <span className="font-medium">{unverifiedEmail}</span> for the
                    verification link, or{" "}
                    <button
                      onClick={handleResend}
                      disabled={isResending}
                      className="font-medium underline underline-offset-2 hover:no-underline disabled:opacity-60"
                    >
                      {isResending ? "Sending…" : "resend it"}
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
            </form>
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <MailCheck className="h-3.5 w-3.5 shrink-0" />
              Drivers and admins sign in with their invite link
            </div>
            <p className="text-center text-sm text-muted-foreground">
              New customer?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
