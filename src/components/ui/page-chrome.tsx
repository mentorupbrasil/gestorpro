import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: Readonly<{
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}>) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-gp-border pb-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gp-text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-gp-text">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-gp-text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Surface({
  children,
  className = "",
}: Readonly<{ children: ReactNode; className?: string }>) {
  return <section className={`gp-surface ${className}`.trim()}>{children}</section>;
}
