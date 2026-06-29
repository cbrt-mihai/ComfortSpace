import { Link } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: React.ReactNode;
}

export function Layout({ children, breadcrumbs, actions }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface-raised/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/"
              className="text-lg font-semibold text-text hover:text-accent transition-colors shrink-0"
            >
              ComfortSpace
            </Link>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-2 text-sm text-text-muted min-w-0 truncate">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-2 min-w-0">
                    <span className="text-border">/</span>
                    {crumb.to ? (
                      <Link
                        to={crumb.to}
                        className="hover:text-text transition-colors truncate"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-text truncate">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
