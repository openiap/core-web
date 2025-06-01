<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount, createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  let Monaco: any;
  let editorDiv:any;
  let model: any;
  let editor: any;
  let { code, language } = $props();
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker&inline";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker&inline";
  import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker&inline";
  import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker&inline";
  import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker&inline";

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
          console.warn(`No worker for label: ${label}`);
          return new editorWorker();
        },
      };
      editor = Monaco.editor.create(editorDiv, {
        value: code,
        language: language,
        automaticLayout: true,
      });
      model = Monaco.editor.createModel(code, language);
      editor.setModel(model);
      // dispatch code change events to parent
      editor.onDidChangeModelContent(() => {
        const value = model.getValue();
        dispatch('change', { code: value });
      });


      return () => {
        editor.dispose();
      };
    }
  }
  onMount(() => {
    init();
  });
  let fakeit = null;
  let fakecode = null;
  $effect(() => {
    fakeit = language;  
    fakecode = code;
    if (browser && model && code) {
      model.setValue(code);
      Monaco.editor.setModelLanguage(model, language);
    }
  });

</script>
<div bind:this={editorDiv} class="h-full w-full"></div>
