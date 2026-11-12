import { useCallback, useEffect, useState } from "react";
import { listSubjects } from "../services/subjects";
import type { Subject } from "../types";

/** Carrega a lista de disciplinas (persistida em localStorage). */
export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await listSubjects();
    setSubjects(data);
    setError(null);
    return data;
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await listSubjects();
        if (alive) setSubjects(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { subjects, loading, error, refresh };
}
