<script lang="ts" module>
  export let collectionname = "users";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { customerSchema } from "../schema.js";

  const key = "billingaccount";
  let loading = $state(false);
  const { data } = $props();
  const form = superForm(defaults(zod(customerSchema)), {
    dataType: "json",
    validators: zod(customerSchema),
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
          toast.success("Billing account updated");
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
  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });
</script>

{#if message && $message != ""}
  {$message}
{/if}

<header class="mb-4">
  <HotkeyButton
    onclick={() => {
      goto(base + "/billingaccount/" + data.id + "/billing");
    }}
  >
    All billing usage
  </HotkeyButton>
  <HotkeyButton
    onclick={() => {
      goto(base + "/licensekey");
    }}
  >
    Manage OpenCore Licenses
  </HotkeyButton>

  {#if data.item?.stripeid != null && data.item?.stripeid != ""}
    <HotkeyButton
      onclick={async () => {
        try {
          const link = await auth.client.CustomCommand({
            command: "getbillingportallink",
            id: data.id,
            jwt: auth.access_token,
          });
          if (link != null && link != "") {
            document.location.href = link.split('"').join("");
          } else {
            toast.error("Error opening billing portal");
          }
        } catch (error: any) {
          toast.error("Error opening billing portal", {
            description: error.message,
          });
        }
      }}
    >
      Open Billing Portal
    </HotkeyButton>
    <HotkeyButton
      onclick={async () => {
        try {
          const link = await auth.client.CustomCommand({
            command: "syncbillingaccount",
            id: data.id,
            jwt: auth.access_token,
          });
          toast.success("Billing account synced");
        } catch (error: any) {
          toast.error("Error opening billing portal", {
            description: error.message,
          });
        }
      }}
    >
      Sync with Stripe
    </HotkeyButton>
  {/if}
</header>
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
    aria-label="Update Billing Account"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Update Billing Account</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
