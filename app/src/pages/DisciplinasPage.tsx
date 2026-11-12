import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FavoritePinButton } from "../components/favorites/FavoritePinButton";
import { FormField } from "../components/ui/FormField";
import { formControlClassName } from "../components/ui/formStyles";
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
import {
  createSubject,
  deleteSubject,
  SUBJECT_COLOR_OPTIONS,
  SUBJECT_COVER_OPTIONS,
  SUBJECT_ICON_OPTIONS,
  updateSubject,
} from "../services/subjects";
import { subjectFavoriteId } from "../stores/favoritesStore";
import { useToastStore } from "../stores/toastStore";
import type { Subject, SubjectColor } from "../types";

type FormState = {
  name: string;
  description: string;
  color: SubjectColor;
  icon: string;
  cover: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  color: "lavender",
  icon: "✿",
  cover: "✿",
};

export function DisciplinasPage() {
  const reduced = useReducedMotionPreference();
  const stagger = getStaggerContainer(reduced);
  const item = getStaggerItem(reduced);
  const press = reduced ? pressableReduced : pressable;
  const { subjects, loading, refresh } = useSubjects();
  const showToast = useToastStore((s) => s.show);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setForm({
      name: subject.name,
      description: subject.description,
      color: subject.color,
      icon: subject.icon,
      cover: subject.cover ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      throw new Error("Informe o nome da disciplina.");
    }
    const payload = {
      name: form.name,
      description: form.description,
      color: form.color,
      icon: form.icon,
      cover: form.cover,
    };
    if (editingId) {
      await updateSubject(editingId, payload);
      showToast("Disciplina atualizada");
    } else {
      await createSubject(payload);
      showToast("Disciplina criada");
    }
    await refresh();
  };

  const handleDelete = async (subject: Subject) => {
    const ok = window.confirm(
      `Excluir “${subject.name}”? Os atalhos desta matéria deixam de funcionar.`,
    );
    if (!ok) return;
    try {
      await deleteSubject(subject.id);
      await refresh();
      showToast("Disciplina excluída");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Biblioteca de matérias</h2>
        <motion.button
          type="button"
          onClick={openCreate}
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
            <motion.div key={subject.id} variants={item} className="relative">
              <Link
                to={subjectContentPath(subject.id)}
                className="block overflow-hidden rounded-2xl border border-bloom-100/80 bg-surface shadow-sm transition hover:shadow-md"
              >
                <div
                  className={cn(
                    "relative flex h-28 items-center justify-center overflow-hidden",
                    SUBJECT_BG[subject.color],
                  )}
                >
                  {subject.cover ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute text-7xl opacity-20"
                    >
                      {subject.cover}
                    </span>
                  ) : null}
                  <span className="relative text-4xl font-semibold text-ink/75">
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
              <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
                <motion.button
                  type="button"
                  aria-label={`Editar ${subject.name}`}
                  onClick={() => openEdit(subject)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
                  {...press}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button
                  type="button"
                  aria-label={`Excluir ${subject.name}`}
                  onClick={() => {
                    void handleDelete(subject);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm hover:bg-white"
                  {...press}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </motion.button>
                <FavoritePinButton
                  size="sm"
                  item={{
                    id: subjectFavoriteId(subject.id),
                    kind: "subject",
                    title: subject.name,
                    subtitle: subject.description,
                    path: subjectContentPath(subject.id),
                    icon: subject.icon,
                    color: subject.color,
                  }}
                />
              </div>
            </motion.div>
          ))}

          <motion.button
            type="button"
            onClick={openCreate}
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
        onClose={closeModal}
        onSubmit={handleSave}
        submitLabel="Salvar"
        title={editingId ? "Editar disciplina" : "Nova disciplina"}
        description="Escolha nome, cor, ícone e capa da matéria."
      >
        <div className="space-y-3">
          <FormField label="Nome">
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Ex.: Estruturas de Dados"
              className={formControlClassName}
            />
          </FormField>

          <FormField label="Descrição">
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Breve resumo da matéria"
              className={formControlClassName}
            />
          </FormField>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Cor</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-label={opt.label}
                  aria-pressed={form.color === opt.value}
                  onClick={() => setForm((f) => ({ ...f, color: opt.value }))}
                  className={cn(
                    "h-9 w-9 rounded-full border-2 transition",
                    SUBJECT_BG[opt.value],
                    form.color === opt.value
                      ? "border-bloom-600 ring-2 ring-bloom-300"
                      : "border-transparent hover:border-bloom-200",
                  )}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Ícone</p>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  aria-label={`Ícone ${icon}`}
                  aria-pressed={form.icon === icon}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-lg transition",
                    form.icon === icon
                      ? "bg-bloom-600 text-white"
                      : "bg-bloom-50 text-ink hover:bg-bloom-100",
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Capa</p>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_COVER_OPTIONS.map((cover) => (
                <button
                  key={cover || "none"}
                  type="button"
                  aria-label={cover ? `Capa ${cover}` : "Sem capa"}
                  aria-pressed={form.cover === cover}
                  onClick={() => setForm((f) => ({ ...f, cover }))}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-lg transition",
                    SUBJECT_BG[form.color],
                    form.cover === cover
                      ? "ring-2 ring-bloom-500 ring-offset-1"
                      : "opacity-80 hover:opacity-100",
                  )}
                >
                  {cover || "∅"}
                </button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "relative flex h-20 items-center justify-center overflow-hidden rounded-xl",
              SUBJECT_BG[form.color],
            )}
          >
            {form.cover ? (
              <span
                aria-hidden
                className="pointer-events-none absolute text-5xl opacity-25"
              >
                {form.cover}
              </span>
            ) : null}
            <span className="relative text-3xl font-semibold text-ink/80">
              {form.icon || "✿"}
            </span>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
