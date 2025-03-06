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
  import { Check, Info, Ticket } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { customerSchema } from "../schema.js";

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
          goto(base + `/billingaccount`);
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
  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div class="mx-4 my-1">
  <form method="POST" use:enhance>
    <Form.Field {form} name="name" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Edit Billing Account Name</Form.Label>
          <div class="md:flex md:space-x-4">
            <CustomInput
              {...props}
              bind:value={$formData.name}
              class="mb-2 md:mb-0"
            />
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
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  </form>

  <div class="mb-4 md:mb-10">
    <div class="mb-2 bw-100">Billing Usage</div>
    <div class="dark:text-bw500 mb-2">
      View this billling account's usage accross all workspaces
    </div>
    <div>
      <HotkeyButton
        onclick={() => {
          goto(base + "/billingaccount/" + data.id + "/billing");
        }}
      >
        <Info />
        All billing usage
      </HotkeyButton>
    </div>
  </div>

  <div class="mb-4 md:mb-10">
    <div class="mb-2">Manage OpenCore Licenses</div>
    <div class="dark:text-bw500 mb-2">Manage all of your OpenCore Licenses</div>
    <div>
      <HotkeyButton
        onclick={() => {
          goto(base + "/licensekey");
        }}
      >
        <Ticket />
        Manage OpenCore Licenses
      </HotkeyButton>
    </div>
  </div>

  <div
    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 md:mb-10"
  >
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
        <Info />
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
        <Ticket />
        Sync with Stripe
      </HotkeyButton>
    {/if}
  </div>

  <CustomSuperDebug {formData} />
</div>
