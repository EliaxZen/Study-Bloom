import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { SimpleModal } from "../components/ui/SimpleModal";
import { subjectContentPath } from "../constants/contentRoutes";
import { useSubjects } from "../hooks/useSubjects";
import {
  getStaggerContainer,
  getStaggerItem,
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../lib/motion";
import { SUBJECT_BG } from "../lib/subjectColors";
import { cn } from "../lib/utils";

export function DisciplinasPage() {
  const reduced = useReducedMotionPreference();
  const stagger = getStaggerContainer(reduced);
  const item = getStaggerItem(reduced);
  const press = reduced ? pressableReduced : pressable;
  const { subjects, loading } = useSubjects();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Biblioteca de matérias</h2>
        <motion.button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-bloom-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-bloom-700"
          {...press}
        >
          <Plus className="h-4 w-4" />
          Nova disciplina
        </motion.button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {subjects.map((subject) => (
            <motion.div key={subject.id} variants={item}>
              <Link
                to={subjectContentPath(subject.id)}
                className="block overflow-hidden rounded-2xl border border-bloom-100/80 bg-surface shadow-sm transition hover:shadow-md"
              >
                <div
                  className={cn(
                    "flex h-28 items-center justify-center",
                    SUBJECT_BG[subject.color],
                  )}
                >
                  <span className="text-4xl font-semibold text-ink/75">
                    {subject.icon}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="text-base font-semibold text-ink">
                      {subject.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {subject.description}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-pastel-lavender px-2.5 py-1 text-xs font-medium text-bloom-700">
                    {subject.materialsCount} materiais
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}

          <motion.button
            type="button"
            onClick={() => setModalOpen(true)}
            variants={item}
            className="overflow-hidden rounded-2xl border border-dashed border-bloom-200 bg-surface text-left shadow-sm transition hover:border-bloom-300 hover:bg-bloom-50/40"
          >
            <div className="flex h-28 items-center justify-center bg-bloom-50">
              <span className="text-3xl text-bloom-400">✿</span>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  + Adicionar matéria
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Personalize capa, ícone e cor
                </p>
              </div>
              <span className="inline-flex rounded-full bg-pastel-lavender px-2.5 py-1 text-xs font-medium text-bloom-700">
                Criar disciplina
              </span>
            </div>
          </motion.button>
        </motion.div>
      )}

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova disciplina"
        description="Placeholder do fluxo de criação — escolha nome, cor e ícone."
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Nome</span>
            <input
              type="text"
              placeholder="Ex.: Estruturas de Dados"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Descrição</span>
            <input
              type="text"
              placeholder="Breve resumo da matéria"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
        </div>
      </SimpleModal>
    </div>
  );
}
