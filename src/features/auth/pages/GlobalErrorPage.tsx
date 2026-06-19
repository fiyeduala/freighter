import { Link, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function isRouteError(err: unknown): err is { status: number; statusText: string } {
  return typeof err === "object" && err !== null && "status" in err;
}

export function GlobalErrorPage() {
  const error = useRouteError();
  const is404 = isRouteError(error) && error.status === 404;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight">{is404 ? "404" : "Error"}</h1>
        <h2 className="text-xl font-semibold">
          {is404 ? "Page not found" : "Something went wrong"}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {is404
            ? "The page you're looking for doesn't exist or has been moved."
            : "An unexpected error occurred. Try refreshing the page or go back to safety."}
        </p>
        {!is404 && error instanceof Error && (
          <p className="mx-auto max-w-sm rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {error.message}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh page
        </Button>
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
