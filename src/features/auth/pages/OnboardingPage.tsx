import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Clock, Loader2, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarding_complete) {
    const path = user.role === "admin" ? "/admin" : user.role === "customer" ? "/app" : "/driver";
    return <Navigate to={path} replace />;
  }

  const dashboardPath =
    user.role === "admin" ? "/admin" : user.role === "customer" ? "/app" : "/driver";

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      navigate(dashboardPath, { replace: true });
    } catch {
      toast.error("Something went wrong — please try again");
    } finally {
      setIsLoading(false);
    }
  };

  if (user.role === "customer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Truck className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Welcome, {user.name.split(" ")[0]}!</h1>
            <p className="text-sm text-muted-foreground">Your account is set up and ready to go.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What you can do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { icon: PackageCheck, text: "Book shipments and get real-time tracking" },
                  { icon: ShieldCheck, text: "Manage invoices and payment history" },
                  { icon: Truck, text: "Save delivery addresses for faster checkout" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={handleComplete} disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin" />}
                Go to dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role === "driver") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Truck className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Welcome, {user.name.split(" ")[0]}!</h1>
            <p className="text-sm text-muted-foreground">
              Complete your profile to start taking jobs.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Getting started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Upload your documents",
                    body: "Add your driver's licence, ID, vehicle papers, and insurance from your profile — Documents section.",
                  },
                  {
                    icon: Clock,
                    title: "Wait for verification",
                    body: "Our team reviews submissions within 24–48 hours and will notify you once approved.",
                  },
                  {
                    icon: PackageCheck,
                    title: "Start accepting jobs",
                    body: "Once approved you'll receive job offers and can go online to start earning.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={handleComplete} disabled={isLoading}>
                  {isLoading && <Loader2 className="animate-spin" />}
                  Go to my dashboard
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  You can upload documents from{" "}
                  <span className="font-medium">Profile → Documents</span> at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin onboarding
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Admin access granted</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {user.name.split(" ")[0]}. Your admin account is ready.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                "Manage shipments, drivers, and fleet",
                "Invite drivers and other admins",
                "View reports and financial summaries",
                "Configure platform settings",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleComplete} disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              Open admin console
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
