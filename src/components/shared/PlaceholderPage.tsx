import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "./PageHeader";

type PlaceholderPageProps = {
  screenId: string;
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
};

export function PlaceholderPage({
  screenId,
  title,
  description,
  breadcrumbs,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={
          <Badge variant="outline" className="font-mono text-xs">
            {screenId}
          </Badge>
        }
      />
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
            <Construction className="h-4 w-4" />
            Coming in next phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This screen ({screenId} — {title}) is scaffolded and routed. Feature implementation
            follows in Phase 2+.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
