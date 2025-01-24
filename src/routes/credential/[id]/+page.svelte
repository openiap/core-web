<script lang="ts" module>
  export let collectionname = "openrpa";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import SuperDebug, { superForm, defaults } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { toast } from "svelte-sonner";
  import { Check } from "lucide-svelte";
    import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";

  const key = "credential";
  let showdebug = $state(false);
  const { data } = $props();
  let loading = $state(false);
  let errormessage = $state("");
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.UpdateOne({
            collectionname: "openrpa",
            item: form.data,
            jwt: auth.access_token,
          });
          toast.success("Credential updated");
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
  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div>
  Edit {key}
</div>

<form method="POST" use:enhance>
  <Acl bind:value={$formData} />

  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="username">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Username</Form.Label>
        <Input {...props} bind:value={$formData.username} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your username.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="password">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Password</Form.Label>
        <Input {...props} bind:value={$formData.password} type="password" />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your password.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button
    variant="success"
    size="base"
    disabled={loading}
    aria-label="submit"
  >
    <Check />
    Update {key}</Form.Button
  >
</form>

<CustomSuperDebug {formData} />
