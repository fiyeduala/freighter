import { Badge } from "@/components/ui/badge";
import type { ShipmentStatus } from "@/types";
import type { BadgeProps } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  REQUESTED: { label: "Requested", variant: "warning" },
  REVIEWED: { label: "Reviewed", variant: "info" },
  ASSIGNED: { label: "Assigned", variant: "info" },
  ACCEPTED: { label: "Accepted", variant: "info" },
  EN_ROUTE_TO_PICKUP: { label: "En Route", variant: "default" },
  ARRIVED_AT_PICKUP: { label: "At Pickup", variant: "default" },
  PICKED_UP: { label: "Picked Up", variant: "default" },
  IN_TRANSIT: { label: "In Transit", variant: "default" },
  ARRIVED_AT_DESTINATION: { label: "Arrived", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  VERIFIED: { label: "Verified", variant: "success" },
  PAID: { label: "Paid", variant: "success" },
  CLOSED: { label: "Closed", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  DECLINED: { label: "Declined", variant: "destructive" },
  FAILED: { label: "Failed", variant: "destructive" },
  RETURNED: { label: "Returned", variant: "warning" },
};

type ShipmentStatusBadgeProps = {
  status: ShipmentStatus;
};

export function ShipmentStatusBadge({ status }: ShipmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
