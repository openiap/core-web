<script lang="ts" module>
  export let collectionname = "agents";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Select from "$lib/components/ui/select/index.js";
  import { ArrowLeft, Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

  const page = "package";
  let loading = $state(false);
  let fileData = $state(null);
  let showdebug = $state(false);
  const { data } = $props();
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.UpdateOne({
            collectionname,
            item: { ...form.data, _type: "package" },
            jwt: auth.access_token,
          });
          goto(base + `/${page}`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        } finally {
          loading = false;
        }
      }
    },
  });

  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });

  const selectItems = [
    { value: "nodejs", label: "Nodejs" },
    { value: "python", label: "Python" },
    { value: "dotnet", label: "Dotnet" },
    { value: "rust", label: "Rust" },
    { value: "exec", label: "Exec" },
    { value: "powershell", label: "Powershell" },
  ];

  const triggerContent = $derived(
    selectItems.find((f) => f.value === $formData.language)?.label ??
      "Select a language",
  );

  async function uploadFile(e: any) {
    loading = true;
    const files = e.target.files;
    const file1 = files[0];
    const reader = new FileReader();
    reader.onload = async function () {
      const content = new Uint8Array(reader.result as ArrayBuffer);
      var name = file1.name;
      var type = file1.type;
      var id = await auth.client.UploadFile(
        name,
        type,
        content,
        auth.access_token,
      );
      $formData.fileid = id;
      loading = false;
    };
    reader.readAsArrayBuffer(file1);
  }

  async function downloadFile() {
    try {
      const item: any = await auth.client.FindOne({
        collectionname: "files",
        query: { _id: $formData.fileid },
        jwt: auth.access_token,
      });
      var filecontent: any = await auth.client.DownloadFile({
        id: item._id,
      });
      var blob = new Blob([filecontent], { type: item.contentType });
      var link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = item.name || item.metadata.name;
      link.click();
    } catch (error:any) {
      toast.error("Error downloading file", {
        description: error.message,
      });
    }
  }

  const maindiv = "flex flex-row items-center p-4 max-w-sm";
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div class="mb-4 font-bold">
  Edit {page}
</div>

<form method="POST" use:enhance>
  <HotkeyButton
    disabled={loading}
    onclick={() => goto(base + `/${page}`)}
    aria-label="Back"
  >
    <ArrowLeft />
    Back</HotkeyButton
  >
  <Form.Button disabled={loading} aria-label="Submit">
    <Check />
    Submit</Form.Button
  >

  <Form.Field {form} name="name" class={maindiv}>
    <Form.Control>
      {#snippet children({ props })}
        <div class="grid grid-cols-3 items-center">
          <Form.Label class="col-span-1">Name</Form.Label>
          <div class="col-span-2">
            <Input disabled={loading} {...props} bind:value={$formData.name} />
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="language" class={maindiv}>
    <Form.Control>
      {#snippet children({ props })}
        <div class="grid grid-cols-3 items-center gap-8">
          <Form.Label class="col-span-1">Language</Form.Label>
          <div class="col-span-2">
            <Select.Root
              type="single"
              {...props}
              bind:value={$formData.language}
            >
              <Select.Trigger>{triggerContent}</Select.Trigger>
              <Select.Content>
                {#each selectItems as item}
                  <Select.Item value={item.value} label={item.label}
                    >{item.label}</Select.Item
                  >
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="chromium" class={maindiv}>
    <Form.Control>
      {#snippet children({ props })}
        <div class="grid grid-cols-3 items-center gap-8">
          <Form.Label class="col-span-1">Require <br />Chromium</Form.Label>
          <Checkbox
            class="col-span-2"
            disabled={loading}
            {...props}
            bind:checked={$formData.chromium}
          />
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="daemon" class={maindiv}>
    <Form.Control>
      {#snippet children({ props })}
        <div class="grid grid-cols-3 items-center justify-center gap-11">
          <Form.Label class="col-span-1">Daemon</Form.Label>
          <div class="col-span-2">
            <Checkbox
              disabled={loading}
              {...props}
              bind:checked={$formData.daemon}
            />
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <div class={maindiv}>
    <div>Package file (OLD)</div>
    <Button
      class="ml-4"
      disabled={loading || !$formData.fileid}
      onclick={downloadFile}
      aria-label="Download">Download</Button
    >
  </div>

  <Form.Field {form} name="fileid" class={maindiv}>
    <Form.Control>
      <Form.Label>Package file (NEW)</Form.Label>
      <div class="flex flex-col space-y-2 ms-10">
        <div class="flex max-w-sm space-x-2">
          <Input
            disabled={loading}
            type="file"
            bind:value={fileData}
            onchange={uploadFile}
          />
          <Button
            disabled={loading || !fileData}
            onclick={() => (fileData = null)}
            aria-label="Delete"
          >
            Delete
          </Button>
        </div>
        <div class="text-sm text-gray-500">
          If no file is chosen, the default package will be <span>
            https://github.com/openiap/nodeworkitemagent.git
          </span>
        </div>
      </div>
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <div></div>

  <Form.Button disabled={loading} aria-label="Submit">Submit</Form.Button>
</form>

{#if formData != null && showdebug == true}
  <SuperDebug data={formData} theme="vscode" />
{/if}

<HotkeyButton
  hidden
  class="hidden"
  aria-label="Toggle debug"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
