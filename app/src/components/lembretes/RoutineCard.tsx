export function RoutineCard() {
  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <h3 className="text-base font-bold text-ink">Rotina equilibrada ♡</h3>
      <p className="mt-2 text-sm text-muted">
        Escolha horários, pausas e alertas
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-pastel-mint px-3 py-1.5 text-xs font-semibold text-ink">
          Pausas de 5 min
        </span>
        <span className="rounded-full bg-pastel-lavender px-3 py-1.5 text-xs font-semibold text-ink">
          Notificação 15 min antes
        </span>
      </div>
    </section>
  );
}
