<script lang="ts" module>
  export let collectionname = "users";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
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

<header>
<Button
  variant="outline"
  size="base"
  onclick={() => {
    goto(base + "/billingaccount/" + data.id + "/billing");
  }}
>
billing usage
</Button>
{#if data.item?.stripeid != null && data.item?.stripeid != ""}
<Button
  variant="outline"
  size="base"
  onclick={async () => {
    try {
      const link = await auth.client.CustomCommand({
      command: "getbillingportallink",
      id: data.id,
      jwt: auth.access_token,
    });
    if(link != null && link != "") {
      document.location.href = link.split('"').join("");
    } else {
      toast.error("Error opening billing portal");
    }        
    } catch (error:any) {
      toast.error("Error opening billing portal", {
        description: error.message,
      });
    }
  }}
>
  Open Billing Portal
</Button>
<Button
variant="outline"
size="base"
onclick={async () => {
  try {
    const link = await auth.client.CustomCommand({
    command: "syncbillingaccount",
    id: data.id,
    jwt: auth.access_token,
  });
  toast.success("Billing account synced");
  } catch (error:any) {
    toast.error("Error opening billing portal", {
      description: error.message,
    });
  }
}}
>
Sync with Stripe
</Button>
{/if}
</header>
<form method="POST" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Company Name</Form.Label>
        <Input {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your company name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button
    disabled={loading}
    aria-label="Update Billing account"
    title="Update Billing account"
    variant="success"
    size="base"
  >
    <Check />
    Update Billing account</Form.Button
  >
</form>

<CustomSuperDebug {formData} />

