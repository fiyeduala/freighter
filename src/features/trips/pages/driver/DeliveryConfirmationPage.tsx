import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera, PenLine, KeyRound, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { updateShipmentStatus } from "@/lib/shipmentEvents";
import { useAuthStore } from "@/stores/authStore";
import type { OrgSettingsRow } from "@/types/supabase";

export function DeliveryConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // POD settings from org
  const { data: settings } = useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("org_settings")
        .select("*")
        .eq("_singleton", true)
        .single();
      return data as OrgSettingsRow | null;
    },
  });

  const requirePhoto = settings?.require_photo ?? true;
  const requireSignature = settings?.require_signature ?? false;
  const requireOtp = settings?.require_otp ?? false;
  const requireName = settings?.require_recipient_name ?? true;

  // Form state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureAcknowledged, setSignatureAcknowledged] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const sendOtp = async () => {
    if (!id) return;
    setIsSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ otp: string; expires_at: string }>(
        "send-delivery-otp",
        { body: { shipment_id: id } },
      );
      if (error) throw new Error(error.message);
      setGeneratedOtp(data?.otp ?? null);
      setOtpSent(true);
      toast.success("OTP sent to customer");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = () => {
    if (!generatedOtp) {
      toast.error("Send OTP first");
      return;
    }
    if (otp.trim() === generatedOtp.trim()) {
      setOtpVerified(true);
      toast.success("OTP verified");
    } else {
      toast.error("OTP does not match");
    }
  };

  const canSubmit = () => {
    if (requirePhoto && photoFiles.length === 0) return false;
    if (requireName && !recipientName.trim()) return false;
    if (requireOtp && !otpVerified) return false;
    if (requireSignature && !signatureAcknowledged) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !id || !user) return;
    setIsSubmitting(true);
    try {
      // Upload photos to storage
      const photoUrls: string[] = [];
      for (const file of photoFiles) {
        const path = `delivery-proofs/${id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("driver-docs")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("driver-docs").getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      // Insert delivery proof
      const { error: proofErr } = await supabase.from("delivery_proofs").insert({
        shipment_id: id,
        photo_urls: photoUrls,
        signature_url: null,
        recipient_name: recipientName || null,
        otp_verified: otpVerified,
        notes: notes || null,
        failed_reason: null,
      });
      if (proofErr) throw proofErr;

      // Advance status to DELIVERED
      await updateShipmentStatus(
        id,
        "DELIVERED",
        user.id,
        undefined,
        "Delivery confirmed by driver",
      );

      toast.success("Delivery confirmed!");
      navigate(`/driver/trips`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Confirmation"
        breadcrumbs={[
          { label: "Trips", href: "/driver/trips" },
          { label: "Detail", href: `/driver/trips/${id}` },
          { label: "Confirm" },
        ]}
      />

      {/* Photo capture */}
      {requirePhoto && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4" />
              Delivery photo {requirePhoto && <span className="text-destructive">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setPhotoFiles((prev) => [...prev, ...files]);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => photoRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              {photoFiles.length === 0
                ? "Take / upload photo"
                : `${photoFiles.length} photo(s) selected — add more`}
            </Button>
            {photoFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photoFiles.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      className="h-20 w-20 rounded-md border object-cover"
                      alt="proof"
                    />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
                      onClick={() => setPhotoFiles((prev) => prev.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recipient name */}
      {requireName && (
        <Card>
          <CardContent className="space-y-1.5 pt-4">
            <Label>
              Recipient name {requireName && <span className="text-destructive">*</span>}
            </Label>
            <Input
              placeholder="Name of person who received the delivery"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* OTP verification */}
      {requireOtp && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4" />
              OTP Verification <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!otpVerified ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Send an OTP to the customer. Ask them for the code shown in their app.
                </p>
                {!otpSent ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => void sendOtp()}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp && <Loader2 className="animate-spin" />}
                    Send OTP to customer
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {generatedOtp && (
                      <div className="rounded-md bg-muted p-2 text-center">
                        <p className="mb-1 text-xs text-muted-foreground">
                          Customer's code should match:
                        </p>
                        <p className="font-mono text-2xl font-bold tracking-widest">
                          {generatedOtp}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code customer gives you"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="text-center font-mono text-lg tracking-widest"
                        maxLength={6}
                      />
                      <Button onClick={verifyOtp} disabled={!otp.trim()}>
                        Verify
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => void sendOtp()}
                    >
                      Resend OTP
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">OTP verified</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Signature acknowledgement (placeholder — real signature pad in Phase 8) */}
      {requireSignature && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PenLine className="h-4 w-4" />
              Signature <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={signatureAcknowledged}
                onCheckedChange={(v) => setSignatureAcknowledged(!!v)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground">
                I confirm the recipient has signed for this delivery (digital signature pad coming
                in next release).
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardContent className="space-y-1.5 pt-4">
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="Any delivery notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Validation hint */}
      {!canSubmit() && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {requirePhoto && photoFiles.length === 0 && "Add at least one delivery photo. "}
            {requireName && !recipientName.trim() && "Enter recipient name. "}
            {requireOtp && !otpVerified && "Verify the OTP. "}
            {requireSignature && !signatureAcknowledged && "Acknowledge the signature. "}
          </span>
        </div>
      )}

      <Button
        className="w-full"
        disabled={!canSubmit() || isSubmitting}
        onClick={() => void handleSubmit()}
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Confirm delivery
      </Button>
    </div>
  );
}
