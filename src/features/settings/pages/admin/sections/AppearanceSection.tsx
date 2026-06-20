import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgSettings } from "@/features/settings/hooks/useOrgSettings";

export function AppearanceSection() {
  const { settings, isLoading, update, isSaving } = useOrgSettings();
  const [logoUrl, setLogoUrl] = useState("");
  const [showDanger, setShowDanger] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (settings) setLogoUrl(settings.logo_url ?? "");
  }, [settings]);

  const saveLogo = () => {
    update({ logo_url: logoUrl || null });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Logo shown on invoices and the login screen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <div className="flex gap-2">
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1"
              />
              <Button
                onClick={saveLogo}
                disabled={isSaving || logoUrl === (settings?.logo_url ?? "")}
              >
                {isSaving && <Loader2 className="animate-spin" />}
                Save
              </Button>
            </div>
          </div>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-12 w-auto rounded border object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Irreversible actions. Only super admins should access these.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium">Export all data</p>
              <p className="text-xs text-muted-foreground">
                Download a full export of your platform data.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Data export — coming in a future release")}
            >
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-md border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium text-destructive">Deactivate organisation</p>
              <p className="text-xs text-muted-foreground">
                Suspends all users and stops new bookings. Cannot be undone without support.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowDanger(true)}>
              <AlertTriangle className="h-4 w-4" />
              Deactivate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDanger} onOpenChange={setShowDanger}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Deactivate organisation?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              This will suspend all users and stop new bookings immediately. Type{" "}
              <strong>DEACTIVATE</strong> to confirm.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DEACTIVATE"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={confirmText !== "DEACTIVATE"}
                onClick={() => {
                  toast.error(
                    "Deactivation requires a support request — contact Freighter support.",
                  );
                  setShowDanger(false);
                  setConfirmText("");
                }}
              >
                Confirm deactivation
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDanger(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
