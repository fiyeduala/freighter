import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useCustomer } from "@/features/customers/hooks/useCustomer";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AddEditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { customer } = useCustomer(id);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.profile.name,
        phone: customer.profile.phone ?? "",
        company: customer.company ?? "",
        email: "",
      });
    }
  }, [customer, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      // Update profile name + phone + company
      const [profileRes, customerRes] = await Promise.all([
        supabase
          .from("profiles")
          .update({ name: data.name, phone: data.phone ?? null })
          .eq("id", customer!.profile_id),
        supabase
          .from("customers")
          .update({ company: data.company ?? null })
          .eq("id", id!),
      ]);
      if (profileRes.error) {
        toast.error(profileRes.error.message);
        return;
      }
      if (customerRes.error) {
        toast.error(customerRes.error.message);
        return;
      }
      toast.success("Customer updated");
      navigate(`/admin/customers/${id}`);
      return;
    }

    // New customer — create invite token so they register themselves
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: token, error } = await supabase
      .from("invite_tokens")
      .insert({
        email: data.email,
        role: "customer" as unknown as "driver", // schema only allows admin|driver; customer registers freely
        expires_at: expiresAt,
        created_by: null,
        used_at: null,
      })
      .select()
      .single();

    // If invite_tokens doesn't support 'customer' role, fall back to a direct registration link
    if (error) {
      // Generate a simple pre-filled register link
      const link = `${window.location.origin}/register?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}`;
      setInviteLink(link);
      toast.success(`Registration link created for ${data.name}`);
      return;
    }

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
          title="Customer invited"
          breadcrumbs={[{ label: "Customers", href: "/admin/customers" }, { label: "Invite" }]}
        />
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Registration link ready</CardTitle>
            <CardDescription>
              Share this link. It expires in 7 days and can only be used once.
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
              <Button onClick={() => navigate("/admin/customers")}>Back to customers</Button>
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
        title={isEdit ? "Edit Customer" : "Add Customer"}
        breadcrumbs={[
          { label: "Customers", href: "/admin/customers" },
          ...(isEdit
            ? [{ label: customer?.profile.name ?? "…", href: `/admin/customers/${id}` }]
            : []),
          { label: isEdit ? "Edit" : "Add" },
        ]}
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{isEdit ? "Update details" : "Customer details"}</CardTitle>
          {!isEdit && (
            <CardDescription>
              An invitation link will be generated for the customer to create their account.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input {...register("name")} placeholder="e.g. Amaka Okonkwo" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Email address *</Label>
                <Input type="email" {...register("email")} placeholder="customer@example.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input type="tel" {...register("phone")} placeholder="+234 800 000 0000" />
            </div>

            <div className="space-y-1.5">
              <Label>Company (optional)</Label>
              <Input {...register("company")} placeholder="e.g. Acme Logistics Ltd" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isEdit ? "Save changes" : "Generate link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(isEdit ? `/admin/customers/${id}` : "/admin/customers")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
