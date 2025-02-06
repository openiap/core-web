<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newLicenseSchema } from "../schema.js";

  const key = "license";
  let loading = $state(false);
  let errormessage = $state("");
  const form = superForm(defaults(zod(newLicenseSchema)), {
    dataType: "json",
    validators: zod(newLicenseSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          const license = JSON.parse(
            await auth.client.CustomCommand({
              command: "ensurelicense",
              data: JSON.stringify(form.data),
              jwt: auth.access_token,
            }),
          );
          toast.success("License added");
          goto(base + `/licensekey/${license._id}`);
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
  if ($formData._billingid == null) {
    $formData._billingid = "";
  }
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}
{#if $formData}
<form method="POST" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>License Domain</Form.Label>
        <CustomInput {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the domain name ( fqdn ) of the OpenCore instance.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="_billingid">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Billing Account</Form.Label>
        <EntitySelector bind:value={$formData._billingid} collectionname="users" {loading}
        basefilter={{ _type: "customer" }}
        >
        </EntitySelector>
      {/snippet}
    </Form.Control>
    <Form.Description>License is linked to this Billing Account.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <div class="flex items-center space-x-5">
    <Form.Button
      disabled={loading}
      aria-label="Create"
      variant="success"
      size="base"
    >
      <Check />
      Create {key}</Form.Button
    >
    <HotkeyButton
      size="lg"
      aria-label="Cancel"
      onclick={() => goto(base + `/licensekey`)}>Cancel</HotkeyButton
    >
  </div>
</form>

<CustomSuperDebug {formData} />
{/if}
