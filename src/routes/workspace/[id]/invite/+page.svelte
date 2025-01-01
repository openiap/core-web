<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import SuperDebug, { defaults,superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newMemberSchema } from "../../schema.js";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { toast } from "svelte-sonner";
  
  const { data } = $props();
  const key = "workspace";
  let showdebug = $state(false);
  let errormessage = $state("");
  const form = superForm(defaults(zod(newMemberSchema)), {
    dataType: "json",
    validators: zod(newMemberSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        try {
          form.data.workspaceid = data.id;
          await auth.client.CustomCommand({ command: "inviteuser", data: JSON.stringify(form.data), jwt: auth.access_token });
          toast.success("User invited successfully");
          goto(base + `/${key}/${data.id}/member`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        }
      } else{
        console.log(form.errors);
        errormessage = "Form is not valid" + form.errors;
        toast.error("Error", {
            description: "Form is not valid ",
          });

      }
    }
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
  <Form.Field {form} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input {...props} bind:value={$formData.email} />
      {/snippet}
    </Form.Control>
    <Form.Description>The user you want to invite</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button aria-label="Create workspace">Create Invitation</Form.Button>
  <HotkeyButton aria-label="Cancel" onclick={() => goto(base + `/${key}/${$formData.workspaceid}`)}>Cancel</HotkeyButton>
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
