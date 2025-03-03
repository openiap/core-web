<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

  let fileData = $state(null);
  let loading = $state(false);

  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          const result = await auth.client.InsertOne({
            collectionname: "agents",
            item: { ...form.data },
            jwt: auth.access_token,
          });
          toast.success("Package created");
          goto(base + `/package`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        loading = false;
        toast.error("Error", {
          description: "Form is invalid",
        });
      }
    },
  });

  const { form: formData, enhance, message } = form;

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
      var type = file1.typr;
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
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Form.Field {form} name="name" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <CustomInput
          disabled={loading}
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="language" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Language</Form.Label>
        <CustomSelect
          {loading}
          {...props}
          bind:value={$formData.language}
          onValueChangeFunction={() => {}}
          selectitems={selectItems}
          triggerContent={() => triggerContent}
          type="single"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="chromium"
    class="flex flex-row items-start space-x-3 space-y-0 mb-7 "
  >
    <Form.Control>
      {#snippet children({ props })}
        <CustomCheckbox
          disabled={loading}
          {...props}
          bind:checked={$formData.chromium}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Require Chromium</Form.Label>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="daemon"
    class="flex flex-row items-start space-x-3 space-y-0 mb-7 "
  >
    <Form.Control>
      {#snippet children({ props })}
        <CustomCheckbox
          disabled={loading}
          {...props}
          bind:checked={$formData.daemon}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Daemon</Form.Label>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="fileid" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Package file</Form.Label>
        <div class="flex items-center space-x-5">
          <CustomInput
            size="md"
            disabled={loading}
            type="file"
            bind:value={fileData}
            onchangefunction={uploadFile}
          />
          <HotkeyButton
            disabled={loading || !fileData}
            onclick={() => (fileData = null)}
            aria-label="Clear"
            variant="danger"
            size="lg"
          >
            Clear
          </HotkeyButton>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <div class="mb-7">
    git example <span> https://github.com/openiap/nodeworkitemagent.git </span>
  </div>

  <Form.Button
    disabled={loading}
    aria-label="Create Package"
    variant="success"
    size="base"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create Package</Form.Button
  >
</form>

<CustomSuperDebug {formData} />
