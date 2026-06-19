import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <MapPin className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          The route you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Go to dashboard</Link>
      </Button>
    </div>
  );
}
