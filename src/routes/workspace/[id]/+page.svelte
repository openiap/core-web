<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import SuperDebug, { superForm, superValidate } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newWorkspaceSchema } from "../schema.js";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { toast } from "svelte-sonner";

  const key = "workspace";
  let showdebug = $state(false);
  const { data } = $props();
  const form = superForm(data.form, {
    dataType: "json",
    validators: zod(newWorkspaceSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        try {
          await auth.client.CustomCommand({ command: "ensureworkspace", data: JSON.stringify(form.data), jwt: auth.access_token });
          toast.success("Workspace updated");
        } catch (error:any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        }
      }
    },
  });
  const { form: formData, enhance, message } = form;
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Acl bind:value={$formData} />

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
  <Form.Button aria-label="submit">Update workspace</Form.Button>
  <HotkeyButton aria-label="Back" onclick={() => goto(base + `/${key}`)}>Cancel</HotkeyButton>
  <HotkeyButton aria-label="Invite" onclick={() => goto(base + `/${key}/${$formData._id}/member`)}>Members</HotkeyButton>
  <HotkeyButton aria-label="Invite" onclick={() => goto(base + `/${key}/${$formData._id}/invite`)}>Invite user to workspace</HotkeyButton>
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
