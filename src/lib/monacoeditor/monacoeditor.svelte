<script lang="ts">
  import * as monaco from "monaco-editor";
  import { onMount } from "svelte";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
  import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
  import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
  import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

  // accept code and language as props
  export let code: string = '';
  export let language: string = 'plaintext';

  let editorDiv: any;
  let editor: any;
  let model: monaco.editor.ITextModel;

  function loadCode(code: string, language: string) {
    model = monaco.editor.createModel(code, language);

    editor.setModel(model);
  }

  onMount(() => {
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

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    editor = monaco.editor.create(editorDiv, {
      value: '',
      language: language,
      theme: "vs-dark",
      automaticLayout: true,
    });
    // initial load from prop
    loadCode(code, language);

    return () => {
      editor.dispose();
    };
  });

  // update editor when code or language props change
  $: if (model && code !== undefined) {
    model.setValue(code);
    monaco.editor.setModelLanguage(model, language);
  }
</script>

<div bind:this={editorDiv} style="height: 400px;"></div>
