/**
 * Monaco local (Vite + Tauri): pacote empacotado, sem CDN.
 * monaco-editor 0.56: workers via exports map (`monaco-editor/editor/...`).
 * `?worker` + `worker.format: "es"` no vite.config (Vite 8 / Rolldown).
 */
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";
import CssWorker from "monaco-editor/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker?worker";

let configured = false;

export function ensureMonacoWorkers(): void {
  if (configured || typeof window === "undefined") return;
  configured = true;

  (self as typeof self & { MonacoEnvironment?: monaco.Environment }).MonacoEnvironment =
    {
      getWorker(_workerId: string, label: string) {
        if (label === "json") return new JsonWorker();
        if (label === "css" || label === "scss" || label === "less") {
          return new CssWorker();
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
          return new HtmlWorker();
        }
        if (label === "typescript" || label === "javascript") {
          return new TsWorker();
        }
        return new EditorWorker();
      },
    };

  loader.config({ monaco });
}
