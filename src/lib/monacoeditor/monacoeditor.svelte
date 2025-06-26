<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount, createEventDispatcher, onDestroy } from "svelte";
  const dispatch = createEventDispatcher();
  let Monaco: any;
  let editorDiv: any;
  let model: any;
  let editor: any;
  let { code, language } = $props();
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker&inline";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker&inline";
  import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker&inline";
  import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker&inline";
  import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker&inline";
  import { mode } from "mode-watcher";
  import { derived, get } from "svelte/store";

  const currentTheme = derived(mode, (m) =>
    m === "dark" ? "vs-dark" : "vs-light",
  );

  async function init() {
    if (browser) {
      Monaco = await import("monaco-editor");
      self.MonacoEnvironment = {
        getWorker: function (_: any, label: string) {
          if (label === "json") {
            return new jsonWorker();
          }
          if (label === "css" || label === "scss" || label === "less") {
            return new cssWorker();
          }
          if (label === "html" || label === "handlebars" || label === "razor") {
            return new htmlWorker();
          }
          if (label === "typescript" || label === "javascript") {
            return new tsWorker();
          }
          return new editorWorker();
        },
      };
      editor = Monaco.editor.create(editorDiv, {
        theme: get(currentTheme) || "vs-light",
        value: code ?? "",
        language: language,
        automaticLayout: true,
      });
      model = Monaco.editor.createModel(code ?? "", language);
      editor.setModel(model);
      // dispatch code change events to parent
      editor.onDidChangeModelContent(() => {
        const value = model.getValue();
        dispatch("change", { code: value });
      });

      return () => {
        editor.dispose();
      };
    }
  }
  onMount(() => {
    init();
  });
  onDestroy(() => {
    editor?.dispose();
  });

  let fakeit = null;
  let fakecode = null;

  // react to theme or code/language changes
  $effect(() => {
    fakeit = language;
    fakecode = code;
    if (browser && Monaco) {
      Monaco.editor.setTheme(get(currentTheme) || "vs-light");
      if (model) {
        model.setValue(code ?? "");
        Monaco.editor.setModelLanguage(model, language);
      }
    }
  });
</script>

<div
  bind:this={editorDiv}
  class="h-[50vh] lg:h-[94%] w-full bg-bw200 dark:bg-bw850 border dark:border-bw600 rounded-[10px] overflow-hidden"
></div>
