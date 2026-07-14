"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "../actions";
import { isExamGroup, workspaceNavigation } from "./workspace-nav";

const SIDEBAR_KEY = "gestorpro.sidebar.collapsed";

function readCollapsedPreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceShell({
  children,
  tenantLabel,
  userLabel,
  unitLabel,
}: Readonly<{
  children: ReactNode;
  tenantLabel: string;
  userLabel: string;
  unitLabel: string;
}>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [examsPinned, setExamsPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const examsActive = pathname.startsWith("/app/exams");
  const examsOpen = examsActive || examsPinned;
  const sidebarWidth = collapsed ? "w-[72px]" : "w-[240px]";

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-gp-bg text-gp-text">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-gp-accent-strong focus:px-3 focus:py-2 focus:text-[#04150f]"
        href="#conteudo-principal"
      >
        Pular para o conteúdo
      </a>

      {mobileOpen ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={closeMobile}
          type="button"
        />
      ) : null}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex ${sidebarWidth} flex-col bg-gp-sidebar text-gp-sidebar-text transition-[width] duration-200 lg:static ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-14 items-center gap-2 border-b border-white/10 px-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gp-accent text-xs font-bold text-[#04150f]">
              GP
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">GestorPro</p>
                <p className="truncate text-[11px] text-gp-sidebar-muted">Saúde ocupacional</p>
              </div>
            ) : null}
            <button
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              className="ml-auto hidden rounded p-1.5 text-gp-sidebar-muted hover:bg-gp-sidebar-elevated hover:text-white lg:inline-flex"
              onClick={toggleCollapsed}
              type="button"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Módulos do sistema">
            {workspaceNavigation.map((group) => (
              <section className="mb-4" key={group.label}>
                {!collapsed ? (
                  <h2 className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gp-sidebar-muted">
                    {group.label}
                  </h2>
                ) : (
                  <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    if (isExamGroup(item)) {
                      return (
                        <li key="exams">
                          <button
                            aria-expanded={examsOpen}
                            className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-sm ${
                              examsActive
                                ? "bg-gp-accent/15 text-gp-accent"
                                : "text-gp-sidebar-text hover:bg-gp-sidebar-elevated"
                            }`}
                            onClick={() => {
                              if (collapsed) {
                                setCollapsed(false);
                                setExamsPinned(true);
                                return;
                              }
                              if (examsActive) return;
                              setExamsPinned((value) => !value);
                            }}
                            type="button"
                          >
                            <span className="inline-block w-4 text-center text-xs opacity-70">
                              ☰
                            </span>
                            {!collapsed ? (
                              <>
                                <span className="flex-1 font-medium">{item.label}</span>
                                <span className="text-[10px] text-gp-sidebar-muted">
                                  {examsOpen ? "−" : "+"}
                                </span>
                              </>
                            ) : null}
                          </button>
                          {examsOpen && !collapsed ? (
                            <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-white/10 pl-2">
                              {item.children.map((child) => {
                                const active = isActivePath(pathname, child.href);
                                return (
                                  <li key={child.href}>
                                    <Link
                                      className={`block rounded px-2 py-1.5 text-sm ${
                                        active
                                          ? "bg-gp-accent/15 font-medium text-gp-accent"
                                          : "text-gp-sidebar-muted hover:bg-gp-sidebar-elevated hover:text-gp-sidebar-text"
                                      }`}
                                      href={child.href}
                                      onClick={closeMobile}
                                    >
                                      {child.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}
                        </li>
                      );
                    }

                    const active = isActivePath(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          className={`flex items-center gap-2 rounded px-2.5 py-2 text-sm ${
                            active
                              ? "bg-gp-accent/15 font-medium text-gp-accent"
                              : "text-gp-sidebar-text hover:bg-gp-sidebar-elevated"
                          }`}
                          href={item.href}
                          onClick={() => {
                            closeMobile();
                            if (!item.href.startsWith("/app/exams")) setExamsPinned(false);
                          }}
                          title={item.label}
                        >
                          <span className="inline-block w-4 text-center text-xs opacity-70">•</span>
                          {!collapsed ? <span>{item.label}</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gp-border bg-gp-surface px-3 sm:px-4">
            <button
              aria-label="Abrir menu"
              className="gp-btn gp-btn-ghost px-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              Menu
            </button>

            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <span className="truncate text-sm font-medium text-gp-text">{unitLabel}</span>
              <span className="text-gp-border-strong">·</span>
              <span className="truncate text-sm text-gp-text-muted">{tenantLabel}</span>
            </div>

            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-xl">
              <label className="relative hidden min-w-0 flex-1 md:block">
                <span className="sr-only">Busca</span>
                <input
                  className="gp-input h-9"
                  disabled
                  placeholder="Busca (em breve)"
                  type="search"
                />
              </label>
              <button
                aria-label="Alertas"
                className="gp-btn gp-btn-secondary h-9 px-3"
                disabled
                type="button"
              >
                Alertas
              </button>
              <div className="flex items-center gap-2 rounded border border-gp-border bg-gp-bg px-2 py-1">
                <div className="hidden text-right sm:block">
                  <p className="max-w-[10rem] truncate text-xs font-medium text-gp-text">
                    {userLabel}
                  </p>
                  <p className="text-[11px] text-gp-text-muted">Perfil</p>
                </div>
                <form action={signOut}>
                  <button className="gp-btn gp-btn-secondary h-8 px-2.5 text-xs" type="submit">
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-3 py-4 sm:px-5" id="conteudo-principal">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
