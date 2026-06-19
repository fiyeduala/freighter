import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { InviteTokenRow } from "@/types/supabase";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Enter a valid phone number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

type TokenState =
  | { status: "loading" }
  | { status: "invalid"; reason: string }
  | { status: "valid"; invite: InviteTokenRow };

export function InviteAcceptPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tokenState, setTokenState] = useState<TokenState>({ status: "loading" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setTokenState({ status: "invalid", reason: "No invite token found in this link." });
      return;
    }

    supabase
      .from("invite_tokens")
      .select("*")
      .eq("token", token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setTokenState({
            status: "invalid",
            reason: "This invite link is invalid, has already been used, or has expired.",
          });
          return;
        }
        setTokenState({ status: "valid", invite: data });
      });
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (tokenState.status !== "valid") return;
    const { invite } = tokenState;

    setIsSubmitting(true);
    try {
      await signUp(invite.email, data.password, data.name, data.phone, {
        role: invite.role,
        inviteToken: token,
      });
      navigate("/verify-email", { state: { email: invite.email } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed — please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = tokenState.status === "valid" ? tokenState.invite.role : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Freighter</h1>
        </div>

        <Card>
          {tokenState.status === "loading" && (
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Validating your invite…</p>
            </CardContent>
          )}

          {tokenState.status === "invalid" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <CardTitle>Invite not valid</CardTitle>
                <CardDescription>{tokenState.reason}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login">Back to sign in</Link>
                </Button>
              </CardContent>
            </>
          )}

          {tokenState.status === "valid" && (
            <>
              <CardHeader>
                <CardTitle>
                  Accept your {roleLabel === "driver" ? "driver" : "admin"} invite
                </CardTitle>
                <CardDescription>
                  You&apos;ve been invited to join Freighter as a{" "}
                  <span className="font-medium capitalize">{roleLabel}</span>. Fill in your details
                  to create your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={tokenState.invite.email}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="Jane Doe" {...register("name")} />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      {...register("confirm")}
                    />
                    {errors.confirm && (
                      <p className="text-xs text-destructive">{errors.confirm.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    Create my account
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
