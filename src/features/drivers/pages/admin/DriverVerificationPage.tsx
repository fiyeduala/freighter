import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExternalLink, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDriver, type DriverDocuments } from "@/features/drivers/hooks/useDriver";
import { format, parseISO, isBefore } from "date-fns";

const DOC_LABELS: Record<string, string> = {
  licence: "Driver's Licence",
  id_card: "Government ID",
  vehicle_papers: "Vehicle Papers",
  insurance: "Insurance Certificate",
};

function DocCard({
  docKey,
  doc,
}: {
  docKey: string;
  doc: { url?: string | null; number?: string | null; expiry?: string | null } | undefined;
}) {
  const isExpired = doc?.expiry ? isBefore(parseISO(doc.expiry), new Date()) : false;
  const isExpiringSoon =
    !isExpired && doc?.expiry
      ? isBefore(parseISO(doc.expiry), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000))
      : false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{DOC_LABELS[docKey] ?? docKey}</CardTitle>
          {isExpired ? (
            <Badge variant="destructive" className="text-xs">
              Expired
            </Badge>
          ) : isExpiringSoon ? (
            <Badge variant="outline" className="text-xs text-amber-600">
              Expiring soon
            </Badge>
          ) : doc?.url ? (
            <Badge variant="default" className="text-xs">
              Submitted
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Missing
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {doc?.number && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Number:</span> {doc.number}
          </p>
        )}
        {doc?.expiry && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Expiry:</span>{" "}
            <span
              className={isExpired ? "text-destructive" : isExpiringSoon ? "text-amber-600" : ""}
            >
              {format(parseISO(doc.expiry), "dd MMM yyyy")}
            </span>
          </p>
        )}
        {doc?.url ? (
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View document <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-xs italic text-muted-foreground">No document uploaded yet</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DriverVerificationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { driver, isLoading, setVerification } = useDriver(id);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [isActing, setIsActing] = useState(false);

  const docs = ((driver?.documents as unknown) ?? {}) as DriverDocuments;

  const handleApprove = () => {
    setIsActing(true);
    setVerification(
      { status: "approved" },
      {
        onSuccess: () => navigate(`/admin/drivers/${id}`),
        onSettled: () => setIsActing(false),
      },
    );
  };

  const handleReject = () => {
    if (!rejectNote.trim()) return;
    setIsActing(true);
    setVerification(
      { status: "rejected", note: rejectNote },
      {
        onSuccess: () => {
          setRejectOpen(false);
          navigate(`/admin/drivers/${id}`);
        },
        onSettled: () => setIsActing(false),
      },
    );
  };

  const handleMarkUnderReview = () => {
    setVerification({ status: "under_review" });
  };

  const docKeys = ["licence", "id_card", "vehicle_papers", "insurance"];
  const allDocsPresent = docKeys.every((k) => !!(docs as Record<string, unknown>)[k]);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!driver) {
    return <p className="text-muted-foreground">Driver not found.</p>;
  }

  return (
    <div>
      <PageHeader
        title={`Verify — ${driver.profile.name}`}
        breadcrumbs={[
          { label: "Drivers", href: "/admin/drivers" },
          { label: driver.profile.name, href: `/admin/drivers/${id}` },
          { label: "Verify" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {driver.verification_status !== "under_review" && (
              <Button variant="outline" size="sm" onClick={handleMarkUnderReview}>
                Mark under review
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setRejectOpen(true)}
              disabled={isActing}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isActing || !allDocsPresent}>
              {isActing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve driver
            </Button>
          </div>
        }
      />

      {driver.verification_status === "approved" && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          This driver is already approved and active.
        </div>
      )}

      {driver.verification_status === "rejected" && docs._verification_note && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Previously rejected</p>
            <p className="text-xs">{docs._verification_note}</p>
          </div>
        </div>
      )}

      {!allDocsPresent && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Some documents have not been uploaded yet. The driver must complete their profile first.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {docKeys.map((k) => (
          <DocCard
            key={k}
            docKey={k}
            doc={(docs as Record<string, { url?: string; number?: string; expiry?: string }>)[k]}
          />
        ))}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject driver verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              The driver will be notified with this reason and can re-upload documents.
            </p>
            <div className="space-y-1.5">
              <Label>Rejection reason *</Label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Licence is expired. Please upload a valid licence."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={!rejectNote.trim() || isActing}
                onClick={handleReject}
              >
                {isActing && <Loader2 className="animate-spin" />}
                Confirm rejection
              </Button>
              <Button variant="ghost" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
