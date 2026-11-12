import { useEffect, useState } from "react";
import { NavLink, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronsLeft, ChevronsRight, Heart, Menu, X } from "lucide-react";
import { APP_ROUTES } from "../../constants/navigation";
import {
  getPageVariants,
  pressable,
  pressableReduced,
  springPill,
  springSoft,
  useReducedMotionPreference,
} from "../../lib/motion";
import { cn } from "../../lib/utils";
import { useSemesterStore } from "../../stores/semesterStore";
import { useToastStore } from "../../stores/toastStore";
import { AppToast } from "../ui/AppToast";

function useIsLg() {
  const [isLg, setIsLg] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLg(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isLg;
}

export function AppShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduced = useReducedMotionPreference();
  const isLg = useIsLg();
  const semester = useSemesterStore((s) => s.semester);
  const showToast = useToastStore((s) => s.show);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);

  /** No mobile o drawer é sempre expandido; rail colapsado só no desktop */
  const railCollapsed = isLg && collapsed;

  const current =
    APP_ROUTES.find((route) =>
      route.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(route.path),
    ) ?? APP_ROUTES[0];

  const isContentPage = location.pathname.includes("/conteudo/");
  const headerTitle = isContentPage
    ? "Olá! Pronta para florescer? ✨"
    : current.title;
  const headerSubtitle = isContentPage
    ? "Sua vida acadêmica, um passo de cada vez."
    : current.subtitle;
  const shortCourse =
    location.pathname.startsWith("/notas") ||
    location.pathname.startsWith("/calendario") ||
    location.pathname.startsWith("/revisao") ||
    location.pathname.startsWith("/laboratorio");

  const press = reduced ? pressableReduced : pressable;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isLg) setMobileOpen(false);
  }, [isLg]);

  /** Fio fino de progresso na troca de rota */
  useEffect(() => {
    if (reduced) {
      setRouteProgress(0);
      return;
    }
    setRouteProgress(0.15);
    const t1 = window.setTimeout(() => setRouteProgress(0.7), 80);
    const t2 = window.setTimeout(() => setRouteProgress(1), 220);
    const t3 = window.setTimeout(() => setRouteProgress(0), 420);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [location.pathname, reduced]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-canvas text-ink">
      {/* Backdrop do drawer (mobile/tablet) */}
      <AnimatePresence>
        {mobileOpen && !isLg ? (
          <motion.button
            key="nav-backdrop"
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-30 bg-ink/35 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.1 : 0.2 }}
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-bloom-200/70 bg-surface px-4 py-5 transition-[transform,width] duration-300 ease-out",
          "lg:static lg:translate-x-0",
          railCollapsed ? "lg:w-[4.5rem] lg:px-2" : "lg:w-60 lg:px-4",
          mobileOpen || isLg ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("mb-5", railCollapsed ? "px-1" : "px-2")}>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bloom-100 text-lg text-bloom-600 lg:h-8 lg:w-8">
              ✿
            </span>
            {!railCollapsed ? (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-base font-bold tracking-tight text-bloom-700">
                  study bloom
                </p>
                <p className="truncate text-xs text-muted">organize & floresça</p>
              </div>
            ) : null}
            {!isLg ? (
              <motion.button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-bloom-50 hover:text-ink lg:hidden"
                aria-label="Fechar menu"
                {...press}
              >
                <X className="h-5 w-5" />
              </motion.button>
            ) : null}
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {APP_ROUTES.map((route) => {
            const Icon = route.icon;
            return (
              <NavLink
                key={route.path}
                to={route.path}
                end={route.path === "/"}
                title={railCollapsed ? route.label : undefined}
                className={({ isActive }) => {
                  const contentActive =
                    isContentPage && route.path === "/disciplinas";
                  const active = isActive || contentActive;
                  return cn(
                    "relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:min-h-0",
                    railCollapsed && "justify-center px-2",
                    active ? "text-bloom-700" : "text-muted hover:text-ink",
                  );
                }}
              >
                {({ isActive }) => {
                  const contentActive =
                    isContentPage && route.path === "/disciplinas";
                  const active = isActive || contentActive;
                  return (
                    <>
                      {active ? (
                        <motion.span
                          layoutId={reduced ? undefined : "nav-active-pill"}
                          className="absolute inset-0 rounded-xl bg-bloom-100"
                          transition={springPill}
                          aria-hidden
                        />
                      ) : null}
                      {!reduced && !active ? (
                        <motion.span
                          className="absolute inset-0 rounded-xl bg-bloom-50 opacity-0"
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          aria-hidden
                        />
                      ) : null}
                      <Icon className="relative z-10 h-4 w-4 shrink-0" />
                      {!railCollapsed ? (
                        <span className="relative z-10 truncate">
                          {route.label}
                        </span>
                      ) : null}
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-3 flex flex-col gap-2">
          <motion.button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden w-full items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-medium text-muted hover:bg-bloom-50 hover:text-ink lg:flex"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            {...press}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </motion.button>

          {!railCollapsed ? (
            <div className="rounded-2xl bg-pastel-lavender p-4">
              <p className="text-xs font-semibold text-bloom-700">
                ✦ Meu semestre
              </p>
              <p className="mt-1 text-sm text-ink">
                {semester.label} ·{" "}
                {shortCourse ? "Computação" : semester.course}
              </p>
              <button
                type="button"
                onClick={() =>
                  showToast("Personalização de tema chega em breve ✿")
                }
                className="mt-3 min-h-11 text-left text-xs font-medium text-bloom-600 hover:underline lg:min-h-0"
              >
                Personalizar tema ↗
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {!reduced && routeProgress > 0 ? (
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] origin-left bg-bloom-400"
            initial={false}
            animate={{ scaleX: routeProgress, opacity: routeProgress >= 1 ? 0 : 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ transformOrigin: "0% 50%" }}
          />
        ) : null}

        <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-5 md:gap-4 md:px-6 md:pt-6 lg:px-8 lg:pt-7">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <motion.button
              type="button"
              className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bloom-50 text-bloom-700 hover:bg-bloom-100 lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              aria-controls="app-sidebar"
              onClick={() => setMobileOpen(true)}
              {...press}
            >
              <Menu className="h-5 w-5" />
            </motion.button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {headerTitle}
              </h1>
              <p className="mt-1 text-sm text-muted">{headerSubtitle}</p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={() =>
              showToast("Favoritos em breve — guarde matérias e conteúdos")
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pastel-pink text-bloom-600 shadow-sm sm:h-10 sm:w-10"
            aria-label="Favoritos"
            {...press}
            transition={springSoft}
          >
            <Heart className="h-4 w-4 fill-current" />
          </motion.button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-auto overflow-x-hidden px-4 pb-6 pt-3 md:px-6 md:pb-8 md:pt-4 lg:px-8">
          {/*
            Só entrada (sem exit/AnimatePresence): useOutlet + exit fazia
            a página antiga ficar presa enquanto a URL já mudava.
          */}
          <motion.div
            key={location.pathname}
            variants={getPageVariants(reduced)}
            initial="initial"
            animate="animate"
            className="min-h-0 w-full max-w-full"
          >
            {outlet}
          </motion.div>
        </div>
      </main>

      <AppToast />
    </div>
  );
}
