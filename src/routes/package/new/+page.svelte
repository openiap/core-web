<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
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
          if ($formData.fileid == "" && $formData.repo == "") {
            toast.error("Error", {
              description: "Either File or git repository  is required",
            });
            cancel();
            loading = false;
            return;
          }
          if ($formData.repo != "") {
            if ($formData.ref == "") {
              toast.error("Error", {
                description: "Select a branch",
              });
              cancel();
              loading = false;
              return;
            }
          }
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
        let errors = Object.keys(form.errors).map(
          (key) => key + " is " + (form.errors as any)[key],
        );
        if (errors.length > 0) {
          toast.error("Error", {
            description: errors.join(", "),
          });
        } else {
          toast.error("Error", {
            description: "Form is invalid",
          });
        }
        cancel();
        loading = false;
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
    $formData.repo = "";
    $formData.ref = "";
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Form.Field {form} name="name" class="mb-10">
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

  <Form.Field {form} name="language" class="mb-10">
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-10 "
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-10 "
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

  <Form.Field {form} name="fileid" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Package file</Form.Label>
        <div class="flex items-center space-x-5">
          <CustomInput
            height="h-full"
            disabled={loading}
            type="file"
            bind:value={fileData}
            onchangefunction={uploadFile}
          />
          <HotkeyButton
            disabled={loading || !fileData}
            onclick={() => {
              fileData = null;
              $formData.fileid = "";
            }}
            aria-label="Clear"
            variant="danger"
            size="file"
          >
            Clear
          </HotkeyButton>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="repo" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Repository</Form.Label>
        <div class="flex items-center space-x-5">
          <EntitySelector
            allowunselect={true}
            propertyname="repo"
            handleChangeFunction={(value: any, item: any) => {
              if (item == null) {
                $formData.ref = "";
                $formData.repo = "";
              } else {
                $formData.ref = item.headref;
                $formData.fileid = "";
                fileData = null;
              }
            }}
            collectionname="git"
            disabled={loading}
            bind:value={$formData.repo}
            basefilter={{ _type: "hash", ref: "HEAD" }}
            name="Repository"
          >
            {#snippet rendername(item: any)}
              {item.repo}
            {/snippet}
            {#snippet rendercontent(item: any)}
              {#if item == null}
                Select a repository
              {:else}
                {item.repo}
              {/if}
            {/snippet}</EntitySelector
          >
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.repo != ""}
    <Form.Field {form} name="ref" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Ref/Branch</Form.Label>
          <div class="flex items-center space-x-5">
            <EntitySelector
              allowunselect={true}
              propertyname="ref"
              collectionname="git"
              disabled={loading}
              bind:value={$formData.ref}
              basefilter={{
                _type: "hash",
                ref: { $ne: "HEAD" },
                repo: $formData.repo,
              }}
              name="Branch"
            >
              {#snippet rendername(item: any)}
                {item.ref}
              {/snippet}
              {#snippet rendercontent(item: any)}
                {#if item == null}
                  Select a branch
                {:else}
                  {item.ref}
                {/if}
              {/snippet}
            </EntitySelector>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  {/if}

  <div class="mb-10">
    git example <span> https://github.com/openiap/nodeworkitemagent.git </span>
  </div>

  <HotkeyButton
    type="submit"
    disabled={loading}
    aria-label="Create Package"
    variant="success"
    size="base"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create Package</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
