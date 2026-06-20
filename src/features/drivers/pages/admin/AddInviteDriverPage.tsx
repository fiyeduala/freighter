import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AddInviteDriverPage() {
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: token, error } = await supabase
      .from("invite_tokens")
      .insert({
        email: data.email,
        role: "driver" as "driver",
        expires_at: expiresAt,
        created_by: null,
        used_at: null,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    await writeAuditLog("invite_driver", "invite_tokens", token.id, { email: data.email } as never);

    const link = `${window.location.origin}/invite?token=${token.token}`;
    setInviteLink(link);
    toast.success(`Invite link created for ${data.name}`);
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inviteLink) {
    return (
      <div>
        <PageHeader
          title="Driver invited"
          breadcrumbs={[{ label: "Drivers", href: "/admin/drivers" }, { label: "Invite" }]}
        />
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Invite link ready</CardTitle>
            <CardDescription>
              Share this link with the driver. It expires in 7 days and can only be used once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
              <p className="flex-1 truncate font-mono text-xs">{inviteLink}</p>
              <Button size="sm" variant="ghost" onClick={copyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin/drivers")}>Back to drivers</Button>
              <Button variant="ghost" onClick={() => setInviteLink(null)}>
                Invite another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invite driver"
        breadcrumbs={[{ label: "Drivers", href: "/admin/drivers" }, { label: "Invite" }]}
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Send invite</CardTitle>
          <CardDescription>
            The driver will receive an invite link to create their account and complete onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input {...register("name")} placeholder="e.g. Emeka Nwosu" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email address *</Label>
              <Input type="email" {...register("email")} placeholder="driver@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input type="tel" {...register("phone")} placeholder="+234 800 000 0000" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Generate invite link
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate("/admin/drivers")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
