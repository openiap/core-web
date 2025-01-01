<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { toast } from "svelte-sonner";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

  const key = "workspace";
  let showdebug = $state(false);
  let loading = $state(false);

  let errormessage = $state("");
  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.CustomCommand({
            command: "ensureworkspace",
            data: JSON.stringify(form.data),
            jwt: auth.access_token,
          });
          goto(base + `/${key}`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        } finally {
          loading = false;
        }
      } else {
        errormessage = "Form is invalid";
      }
    },
  });

  const { form: formData, enhance, message } = form;
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}
<form method="POST" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Workspace Name</Form.Label>
        <Input {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name of your new workspace.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button aria-label="Create workspace">Create workspace</Form.Button>
  <HotkeyButton aria-label="Cancel" onclick={() => goto(base + `/${key}`)}
    >Cancel</HotkeyButton
  >
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
