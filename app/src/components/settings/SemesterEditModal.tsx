/**
 * Edição rápida de semestre/curso (sidebar / header).
 * Usa o mesmo semesterStore que a página Configurações.
 */

import { useEffect, useState } from "react";
import { useSemesterStore } from "../../stores/semesterStore";
import { useToastStore } from "../../stores/toastStore";
import { SimpleModal } from "../ui/SimpleModal";
import { SemesterFields, type SemesterFieldsValue } from "./SemesterFields";

type SemesterEditModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SemesterEditModal({ open, onClose }: SemesterEditModalProps) {
  const semester = useSemesterStore((s) => s.semester);
  const updateSemester = useSemesterStore((s) => s.updateSemester);
  const showToast = useToastStore((s) => s.show);
  const [draft, setDraft] = useState<SemesterFieldsValue>({
    label: semester.label,
    course: semester.course,
  });

  useEffect(() => {
    if (!open) return;
    setDraft({ label: semester.label, course: semester.course });
  }, [open, semester.label, semester.course]);

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title="Meu semestre"
      description="Esses nomes aparecem na barra lateral. Também dá para editar em Configurações."
      submitLabel="Salvar"
      onSubmit={() => {
        if (!draft.label.trim()) throw new Error("Informe o semestre");
        if (!draft.course.trim()) throw new Error("Informe o curso");
        updateSemester({ label: draft.label, course: draft.course });
        showToast("Semestre atualizado ✿");
      }}
    >
      <SemesterFields value={draft} onChange={setDraft} layout="stack" />
    </SimpleModal>
  );
}
