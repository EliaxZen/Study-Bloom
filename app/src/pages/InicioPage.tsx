import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { StatusMessage } from "../components/ui/StatusMessage";
import { subjectContentPath } from "../constants/contentRoutes";
import { useSubjects } from "../hooks/useSubjects";
import {
  getStaggerContainer,
  getStaggerItem,
  useReducedMotionPreference,
} from "../lib/motion";
import { SUBJECT_BG } from "../lib/subjectColors";
import { cn } from "../lib/utils";
import {
  getDashboardStats,
  getTodayAgenda,
  getUpcomingDeliveries,
  type AgendaItem,
  type DashboardStat,
  type DeliveryItem,
} from "../services/dashboard";

const SHORT_NAMES: Record<string, string> = {
  "calc-1": "Cálculo 1",
  redes: "Redes",
  algoritmos: "Algoritmos",
  bd: "Banco de Dados",
};

const STAT_ICON_BG = {
  lavender: "bg-pastel-lavender text-bloom-600",
  blue: "bg-pastel-blue text-sky-600",
  pink: "bg-pastel-pink text-rose-500",
} as const;

function todayLabel(now = new Date()) {
  return now
    .toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    })
    .replace(/\./g, "");
}

export function InicioPage() {
  const reduced = useReducedMotionPreference();
  const stagger = getStaggerContainer(reduced);
  const item = getStaggerItem(reduced);
  const { subjects, loading, error } = useSubjects();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, a, d] = await Promise.all([
          getDashboardStats(),
          getTodayAgenda(),
          getUpcomingDeliveries(),
        ]);
        if (!alive) return;
        setStats(s);
        setAgenda(a);
        setDeliveries(d);
      } finally {
        if (alive) setDashLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const spotlight = subjects.filter((s) => SHORT_NAMES[s.id]).slice(0, 4);

  return (
    <div className="space-y-6">
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {dashLoading && stats.length === 0 ? (
          <StatusMessage>Carregando resumo…</StatusMessage>
        ) : (
          stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={item}
              className="rounded-2xl border border-bloom-100/80 bg-surface p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted">{stat.label}</p>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    STAT_ICON_BG[stat.iconTone],
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-ink">
                {stat.value}
              </p>
            </motion.div>
          ))
        )}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-bloom-100/80 bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Agenda de hoje</h2>
            <span className="rounded-full bg-pastel-lavender px-3 py-1 text-xs font-medium text-bloom-700">
              {todayLabel()}
            </span>
          </div>
          {agenda.length === 0 ? (
            <StatusMessage variant="empty">
              Nenhuma aula marcada para hoje.
            </StatusMessage>
          ) : (
            <ul className="space-y-2">
              {agenda.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3",
                    SUBJECT_BG[item.color],
                  )}
                >
                  <span className="w-12 shrink-0 text-sm font-semibold text-ink/80">
                    {item.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.title}
                    </p>
                  </div>
                  <p className="hidden max-w-[45%] truncate text-right text-xs text-muted sm:block">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-bloom-100/80 bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-ink">
            Próximas entregas
          </h2>
          {deliveries.length === 0 ? (
            <StatusMessage variant="empty">
              Sem entregas próximas. Aproveite para revisar ✿
            </StatusMessage>
          ) : (
            <ul className="space-y-3">
              {deliveries.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      item.done
                        ? "border-bloom-400 bg-bloom-500 text-white"
                        : "border-bloom-200 bg-surface",
                    )}
                    aria-hidden
                  >
                    {item.done ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        item.done ? "text-muted line-through" : "text-ink",
                      )}
                    >
                      {item.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted">{item.when}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Minhas disciplinas</h2>
          <Link
            to="/disciplinas"
            className="text-sm font-medium text-bloom-600 hover:text-bloom-700"
          >
            Ver todas →
          </Link>
        </div>

        {loading ? (
          <StatusMessage>Carregando…</StatusMessage>
        ) : error ? (
          <StatusMessage variant="error">{error}</StatusMessage>
        ) : spotlight.length === 0 ? (
          <StatusMessage variant="empty">
            Nenhuma disciplina ainda. Adicione em Disciplinas.
          </StatusMessage>
        ) : (
          <motion.div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {spotlight.map((subject) => (
              <motion.div key={subject.id} variants={item}>
                <Link
                  to={subjectContentPath(subject.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-6 text-center shadow-sm transition hover:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500",
                    SUBJECT_BG[subject.color],
                  )}
                >
                  <span className="text-2xl font-semibold text-ink/80">
                    {subject.icon}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {SHORT_NAMES[subject.id] ?? subject.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
