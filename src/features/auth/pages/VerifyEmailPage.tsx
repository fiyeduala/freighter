import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Check your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              We sent a verification link to your email address. Click the link to activate your
              account.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button className="text-primary hover:underline">resend the email</button>.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
