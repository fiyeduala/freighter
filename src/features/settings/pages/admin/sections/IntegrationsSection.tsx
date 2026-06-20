import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Integration = {
  name: string;
  description: string;
  envKey: string;
  category: string;
};

const INTEGRATIONS: Integration[] = [
  {
    name: "Mapbox",
    description: "Maps, geocoding, routing and ETA.",
    envKey: "VITE_MAPBOX_TOKEN",
    category: "Maps",
  },
  {
    name: "Paystack",
    description: "Card, bank transfer and USSD payments.",
    envKey: "VITE_PAYSTACK_PUBLIC_KEY",
    category: "Payments",
  },
  {
    name: "Termii",
    description: "SMS OTPs and delivery alerts.",
    envKey: "VITE_TERMII_API_KEY",
    category: "SMS",
  },
  {
    name: "Firebase FCM",
    description: "Web push notifications.",
    envKey: "VITE_FCM_VAPID_KEY",
    category: "Push",
  },
  {
    name: "Resend",
    description: "Transactional email for auth and notifications.",
    envKey: "VITE_RESEND_API_KEY",
    category: "Email",
  },
];

export function IntegrationsSection() {
  const checkEnv = (key: string) => {
    try {
      return Boolean(import.meta.env[key]);
    } catch {
      return false;
    }
  };

  const grouped = INTEGRATIONS.reduce<Record<string, Integration[]>>((acc, int) => {
    (acc[int.category] ??= []).push(int);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            External service connections. Keys are set as environment variables — never store
            secrets in the database. Configure in Vercel → Project → Environment Variables.
          </CardDescription>
        </CardHeader>
      </Card>

      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{category}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {items.map((int) => {
              const configured = checkEnv(int.envKey);
              return (
                <div key={int.name} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{int.name}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {int.envKey}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{int.description}</p>
                  </div>
                  {configured ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Configured</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs">Not set</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
