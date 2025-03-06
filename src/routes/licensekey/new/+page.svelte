<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newLicenseSchema } from "../schema.js";

  let loading = $state(false);

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
          toast.success("License created");
          goto(base + `/licensekey/${license._id}`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        loading = false;
        toast.error("Error", {
          description: "Form is invalid",
        });
      }
    },
  });

  const { form: formData, enhance, message } = form;
  if ($formData._billingid == null) {
    $formData._billingid = "";
  }
</script>

<div class="mx-4 my-1">
  {#if message && $message != ""}
    {$message}
  {/if}
  {#if $formData}
    <form method="POST" use:enhance>
      <Form.Field {form} name="name" class="mb-10">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>License Domain</Form.Label>
            <Form.Description
              >This is the domain name ( fqdn ) of the OpenCore instance.</Form.Description
            >
            <CustomInput {...props} bind:value={$formData.name} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="_billingid" class="mb-10">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Billing Account</Form.Label>
            <Form.Description
              >License is linked to this Billing Account.</Form.Description
            >
            <EntitySelector
              bind:value={$formData._billingid}
              collectionname="users"
              {loading}
              basefilter={{ _type: "customer" }}
            ></EntitySelector>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <div class="flex items-center space-x-5">
        <HotkeyButton
          variant="success"
          size="base"
          disabled={loading}
          aria-label="Create Licence"
          type="submit"
          data-shortcut="ctrl+s"
        >
          <Check />
          Create Licence</HotkeyButton
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
</div>
