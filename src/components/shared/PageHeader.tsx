import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

type Breadcrumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
};

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-6">
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
