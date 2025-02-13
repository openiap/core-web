<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newCustomerSchema } from "../schema.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";

  const key = "billingaccount";
  let loading = $state(false);
  const form = superForm(defaults(zod(newCustomerSchema)), {
    dataType: "json",
    validators: zod(newCustomerSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        try {
          loading = true;
          await auth.client.CustomCommand({
            command: "ensurebilling",
            data: JSON.stringify(form.data),
            jwt: auth.access_token,
          });
          toast.success("Billand Account Created");
          goto(base + `/${key}`);
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
  const { form: formData, enhance, message } = form;
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Company Name</Form.Label>
        <CustomInput {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your company name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <HotkeyButton
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Create Billing Account"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create Billing Account</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
