<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";
    import { CustomInput } from "$lib/custominput/index.js";

  const key = "credential";
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
          await auth.client.InsertOne({
            collectionname: "openrpa",
            item: form.data,
            jwt: auth.access_token,
          });
          toast.success("Credential added");
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
  <Form.Field {form} name="name" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <CustomInput {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="username" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Username</Form.Label>
        <CustomInput {...props} bind:value={$formData.username} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your username.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="password" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Password</Form.Label>
        <CustomInput {...props} bind:value={$formData.password} type="password" />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your password.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
  <Form.Button
    disabled={loading}
    aria-label="submit"
    variant="success"
    size="base"
  >
    <Check />
    Create {key}</Form.Button
  >
</form>

<CustomSuperDebug {formData} />
