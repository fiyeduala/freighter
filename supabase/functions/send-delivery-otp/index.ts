import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function generateOtp(length: number): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { shipment_id } = (await req.json()) as { shipment_id: string };
    if (!shipment_id) throw new Error("shipment_id required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch org settings for otp_length and otp_expiry_minutes
    const { data: settings } = await supabase
      .from("org_settings")
      .select("otp_length, otp_expiry_minutes")
      .eq("_singleton", true)
      .single();

    const otpLength = settings?.otp_length ?? 6;
    const expiryMinutes = settings?.otp_expiry_minutes ?? 10;
    const otp = generateOtp(otpLength);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    // Get shipment + customer profile
    const { data: shipment, error: sErr } = await supabase
      .from("shipments")
      .select("id, customer_id")
      .eq("id", shipment_id)
      .single();
    if (sErr || !shipment) throw new Error("Shipment not found");

    const { data: customer } = await supabase
      .from("customers")
      .select("profile_id")
      .eq("id", shipment.customer_id)
      .single();

    // Send OTP to customer via notification
    if (customer?.profile_id) {
      await supabase.from("notifications").insert({
        recipient_id: customer.profile_id,
        type: "delivery_otp",
        payload: { otp, shipment_id, expires_at: expiresAt } as never,
        channels: ["push"] as never,
        read: false,
        target_url: `/app/history/${shipment_id}`,
      });
    }

    // Return OTP to driver so they can confirm customer has the matching code
    // In production with SMS this would not be returned — customer receives via SMS only
    return new Response(
      JSON.stringify({ otp, expires_at: expiresAt }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
