import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { parseISO, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import type { DriverRow } from "@/types/supabase";

type DocMeta = {
  url?: string | null;
  number?: string | null;
  expiry?: string | null;
};

type DriverDocuments = {
  licence?: DocMeta;
  id_card?: DocMeta;
  vehicle_papers?: DocMeta;
  insurance?: DocMeta;
};

const DOC_CONFIG = [
  {
    key: "licence" as const,
    label: "Driver's Licence",
    description: "Front side of your current, valid driver's licence",
    hasNumber: true,
  },
  {
    key: "id_card" as const,
    label: "Government-Issued ID",
    description: "National ID card, international passport, or voter's card",
    hasNumber: true,
  },
  {
    key: "vehicle_papers" as const,
    label: "Vehicle Papers",
    description: "Proof of ownership / registration for your assigned vehicle",
    hasNumber: false,
  },
  {
    key: "insurance" as const,
    label: "Insurance Certificate",
    description: "Third-party or comprehensive motor insurance",
    hasNumber: false,
  },
];

function DocCard({
  docKey,
  label,
  description,
  hasNumber,
  doc,
  onSave,
  isSaving,
}: {
  docKey: string;
  label: string;
  description: string;
  hasNumber: boolean;
  doc: DocMeta | undefined;
  onSave: (key: string, meta: DocMeta) => void;
  isSaving: boolean;
}) {
  const [number, setNumber] = useState(doc?.number ?? "");
  const [expiry, setExpiry] = useState(doc?.expiry ?? "");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNumber(doc?.number ?? "");
    setExpiry(doc?.expiry ?? "");
  }, [doc]);

  const isExpired = doc?.expiry ? isBefore(parseISO(doc.expiry), new Date()) : false;
  const isExpiringSoon =
    !isExpired && doc?.expiry
      ? isBefore(parseISO(doc.expiry), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000))
      : false;

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${docKey}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("driver-documents")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("driver-documents").getPublicUrl(path);

      onSave(docKey, {
        url: urlData.publicUrl,
        number: hasNumber ? number || null : undefined,
        expiry: expiry || null,
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = () => {
    onSave(docKey, {
      url: doc?.url,
      number: hasNumber ? number || null : undefined,
      expiry: expiry || null,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">{label}</CardTitle>
            <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
          </div>
          {doc?.url ? (
            isExpired ? (
              <Badge variant="destructive" className="shrink-0 text-xs">
                Expired
              </Badge>
            ) : isExpiringSoon ? (
              <Badge variant="outline" className="shrink-0 text-xs text-amber-600">
                Expiring soon
              </Badge>
            ) : (
              <Badge variant="default" className="shrink-0 text-xs">
                Uploaded
              </Badge>
            )
          ) : (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Missing
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasNumber && (
          <div className="space-y-1">
            <Label className="text-xs">Document number</Label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. LAS-12345678"
              className="h-8 text-sm"
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Expiry date</Label>
          <Input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {doc?.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View uploaded document <ExternalLink className="h-3 w-3" />
          </a>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {doc?.url ? "Replace file" : "Upload file"}
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            disabled={isSaving}
            onClick={handleSaveDetails}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save details
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileUpload(file);
          }}
        />
      </CardContent>
    </Card>
  );
}

export function DocumentsPage() {
  const queryClient = useQueryClient();

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driver_profile_docs"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("drivers")
        .select("id, documents, verification_status")
        .eq("profile_id", user.id)
        .single();
      if (error) throw error;
      return data as unknown as Pick<DriverRow, "id" | "documents" | "verification_status">;
    },
  });

  const { mutate: saveDoc, isPending: isSaving } = useMutation({
    mutationFn: async (docs: DriverDocuments) => {
      if (!driver?.id) throw new Error("Driver not found");
      const { error } = await supabase
        .from("drivers")
        .update({ documents: docs as never, verification_status: "under_review" })
        .eq("id", driver.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["driver_profile_docs"] });
      toast.success("Document saved — our team will review it shortly.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const docs = (driver?.documents ?? {}) as DriverDocuments;

  const handleSave = (key: string, meta: DocMeta) => {
    saveDoc({ ...docs, [key]: meta });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        breadcrumbs={[{ label: "Profile", href: "/driver/profile" }, { label: "Documents" }]}
      />

      {driver?.verification_status === "approved" && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your documents are verified. You're approved to take jobs.
        </div>
      )}

      {driver?.verification_status === "rejected" && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Your verification was rejected. Please re-upload the required documents and they will be
          reviewed again.
        </div>
      )}

      {driver?.verification_status === "under_review" && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 shrink-0" />
          Your documents are under review. We'll notify you within 24–48 hours.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {DOC_CONFIG.map((cfg) => (
          <DocCard
            key={cfg.key}
            docKey={cfg.key}
            label={cfg.label}
            description={cfg.description}
            hasNumber={cfg.hasNumber}
            doc={docs[cfg.key]}
            onSave={handleSave}
            isSaving={isSaving}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Accepted formats: JPEG, PNG, PDF. Max 5 MB per file. Documents are stored securely and only
        visible to Freighter admins.
      </p>
    </div>
  );
}
