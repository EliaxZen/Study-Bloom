import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ContentBanner } from "../components/content/ContentBanner";
import { ContentNotes } from "../components/content/ContentNotes";
import { FilesPanel } from "../components/content/FilesPanel";
import { getContentPage, type ContentPageData } from "../services/content";

export function ConteudoPage() {
  const { id, slug } = useParams();
  const [data, setData] = useState<ContentPageData | null>(null);

  useEffect(() => {
    void getContentPage(id, slug).then(setData);
  }, [id, slug]);

  if (!data) {
    return <p className="text-sm text-muted">Carregando conteúdo…</p>;
  }

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
        <Link to="/disciplinas" className="hover:text-bloom-600 hover:underline">
          Disciplinas
        </Link>
        <span aria-hidden>/</span>
        <span className="max-w-[12rem] truncate sm:max-w-none">
          {data.subjectName}
        </span>
        <span aria-hidden>/</span>
        <span className="max-w-full font-medium break-words text-ink">
          {data.breadcrumb}
        </span>
      </nav>

      <ContentBanner
        icon={data.subjectIcon}
        subjectName={data.subjectName}
        color={data.subjectColor}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <ContentNotes
          title={data.title}
          tag={data.tag}
          question={data.question}
          definition={data.definition}
          formulaLatex={data.formulaLatex}
          exampleLatex={data.exampleLatex}
        />
        <FilesPanel attachments={data.attachments} />
      </div>
    </div>
  );
}
