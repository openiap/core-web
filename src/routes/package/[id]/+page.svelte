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
  import { Acl } from "$lib/acl";
  import { auth } from "$lib/stores/auth.svelte.js";

  import SuperDebug, { superForm, defaults } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import * as Select from "$lib/components/ui/select/index.js";

  const page = "package";
  let loading = $state(false);
  let errormessage = $state("");
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
          errormessage = error.message;
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
  
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div>
  Edit {page}
</div>

<form method="POST" use:enhance>
  <Form.Button disabled={loading} aria-label="Submit">Submit</Form.Button>
  <HotkeyButton
    disabled={loading}
    onclick={() => goto(base + `/${page}`)}
    aria-label="Back">Back</HotkeyButton
  >
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input disabled={loading} {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <!-- <Form.Description>This is your public display name.</Form.Description> -->
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="language">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Language</Form.Label>
        <Select.Root type="single" {...props} bind:value={$formData.language}>
          <Select.Trigger>{triggerContent}</Select.Trigger>
          <Select.Content>
            {#each selectItems as item}
              <Select.Item value={item.value} label={item.label}
                >{item.label}</Select.Item
              >
            {/each}
          </Select.Content>
        </Select.Root>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="chromium"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.chromium}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Require Chromium</Form.Label>
          <!-- <Form.Description>
            If enabled, the user is disabled and cannot signin
          </Form.Description> -->
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="daemon"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.daemon}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Daemon</Form.Label>
          <!-- <Form.Description>
            If enabled, the user is can only login using web interface and
            cannot add more data to the database
          </Form.Description> -->
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="package_file">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>package_file</Form.Label>
        <Input disabled={loading} {...props} type="file" />
      {/snippet}
    </Form.Control>
    <!-- <Form.Description>This is your public display name.</Form.Description> -->
    <Form.FieldErrors />
  </Form.Field>

  <div>
    git example <span> https://github.com/openiap/nodeworkitemagent.git </span>
  </div>

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
