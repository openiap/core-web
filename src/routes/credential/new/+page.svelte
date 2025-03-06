<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

  let loading = $state(false);
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
          toast.success("Credential Created");
          goto(base + `/credential`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        toast.error("Error", {
          description: "Form is invalid",
        });
        loading = false;
      }
    },
  });
  const { form: formData, enhance, message } = form;
</script>

<div class="mx-4 my-1">
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
          <CustomInput
            {...props}
            bind:value={$formData.password}
            type="password"
          />
        {/snippet}
      </Form.Control>
      <Form.Description>This is your password.</Form.Description>
      <Form.FieldErrors />
    </Form.Field>

    <HotkeyButton
      variant="success"
      size="base"
      disabled={loading}
      aria-label="Create Credential"
      type="submit"
      data-shortcut="ctrl+s"
    >
      <Check />
      Create Credential</HotkeyButton
    >
  </form>

  <CustomSuperDebug {formData} />
</div>
