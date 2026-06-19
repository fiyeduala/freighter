import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullPage?: boolean;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">{content}</div>
    );
  }

  return <div className="flex justify-center py-12">{content}</div>;
}
