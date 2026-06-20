import { useParams, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, ShieldX, Truck, Star, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDriver, type DriverDocuments } from "@/features/drivers/hooks/useDriver";
import { getInitials } from "@/lib/utils";
import { format, parseISO, isBefore } from "date-fns";

const VERIFICATION_ICONS = {
  approved: CheckCircle2,
  rejected: XCircle,
  pending: Clock,
  under_review: Clock,
};

const VERIFICATION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  under_review: "outline",
  rejected: "destructive",
};

function DocRow({
  label,
  doc,
}: {
  label: string;
  doc: { url?: string | null; number?: string | null; expiry?: string | null } | undefined;
}) {
  if (!doc) return null;
  const isExpired = doc.expiry ? isBefore(parseISO(doc.expiry), new Date()) : false;
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {doc.number && <p className="text-xs text-muted-foreground">#{doc.number}</p>}
      </div>
      <div className="flex items-center gap-2 text-right">
        {doc.expiry && (
          <span className={`text-xs ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
            {isExpired ? "Expired " : "Exp. "}
            {format(parseISO(doc.expiry), "dd MMM yyyy")}
          </span>
        )}
        {doc.url ? (
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View
          </a>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Missing
          </Badge>
        )}
      </div>
    </div>
  );
}

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { driver, isLoading, maintenanceLogs, setProfileStatus } = useDriver(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!driver) {
    return <p className="text-muted-foreground">Driver not found.</p>;
  }

  const docs = ((driver.documents as unknown) ?? {}) as DriverDocuments;
  const VerIcon = VERIFICATION_ICONS[driver.verification_status] ?? Clock;
  const isActive = driver.profile.status === "active";

  return (
    <div>
      <PageHeader
        title={driver.profile.name}
        breadcrumbs={[{ label: "Drivers", href: "/admin/drivers" }, { label: driver.profile.name }]}
        actions={
          <div className="flex items-center gap-2">
            {driver.verification_status !== "approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/drivers/${id}/verify`)}
              >
                <ShieldCheck className="h-4 w-4" />
                Verify
              </Button>
            )}
            <Button
              variant={isActive ? "outline" : "default"}
              size="sm"
              onClick={() => setProfileStatus(isActive ? "suspended" : "active")}
            >
              {isActive ? (
                <>
                  <ShieldX className="h-4 w-4" /> Suspend
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Activate
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Header card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(driver.profile.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background ${
                  driver.online ? "bg-green-500" : "bg-muted-foreground"
                }`}
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{driver.profile.name}</h2>
                <Badge variant={driver.profile.status === "active" ? "default" : "secondary"}>
                  {driver.profile.status}
                </Badge>
                <Badge variant={VERIFICATION_VARIANT[driver.verification_status]}>
                  <VerIcon className="mr-1 h-3 w-3" />
                  {driver.verification_status.replace("_", " ")}
                </Badge>
                <Badge variant="outline">{driver.online ? "Online" : "Offline"}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {driver.profile.phone ?? "No phone"} · Joined{" "}
                {format(parseISO(driver.created_at), "dd MMM yyyy")}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(driver.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                  />
                ))}
                <span className="ml-1 text-muted-foreground">{driver.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {driver.verification_status === "rejected" && docs._verification_note && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-destructive">Verification rejected</p>
                <p className="text-xs text-destructive/80">{docs._verification_note}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate(`/admin/drivers/${id}/verify`)}
                >
                  Re-verify
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Availability</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{driver.online ? "Online" : "Offline"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rating</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{driver.rating.toFixed(1)} / 5</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Assigned vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                {driver.vehicle ? (
                  <Link
                    to={`/admin/fleet/${driver.vehicle.id}`}
                    className="text-primary hover:underline"
                  >
                    {driver.vehicle.plate}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">None assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/drivers/${id}/verify`)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Go to verification
                </Button>
              </div>
            </CardHeader>
            <CardContent className="divide-y">
              <DocRow label="Driver's Licence" doc={docs.licence} />
              <DocRow label="Government ID" doc={docs.id_card} />
              <DocRow label="Vehicle Papers" doc={docs.vehicle_papers} />
              <DocRow label="Insurance Certificate" doc={docs.insurance} />
              {!docs.licence && !docs.id_card && (
                <p className="py-4 text-sm text-muted-foreground">
                  The driver has not uploaded any documents yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle tab */}
        <TabsContent value="vehicle" className="mt-4">
          {driver.vehicle ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Assigned vehicle</CardTitle>
                  <Link to={`/admin/fleet/${driver.vehicle.id}`}>
                    <Button size="sm" variant="outline">
                      <Truck className="h-4 w-4" />
                      View vehicle
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Plate</p>
                    <p className="font-medium">{driver.vehicle.plate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium">{driver.vehicle.vehicle_type?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="font-medium">{driver.vehicle.capacity_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge>{driver.vehicle.status}</Badge>
                  </div>
                </div>

                {maintenanceLogs.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Recent maintenance
                    </p>
                    <div className="space-y-2">
                      {maintenanceLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                          <span>{log.type}</span>
                          <span className="text-muted-foreground">
                            {format(parseISO(log.date), "dd MMM yyyy")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Truck className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No vehicle assigned</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Go to a vehicle in the fleet to assign this driver.
                </p>
                <Button size="sm" className="mt-4" onClick={() => navigate("/admin/fleet")}>
                  Browse fleet
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
