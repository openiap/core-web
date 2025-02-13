<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { CollectionSelector } from "$lib/collectionselector/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";

  const title = "Form Resource";
  const key = "formresource";
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
            collectionname: "forms",
            item: form.data,
            jwt: auth.access_token,
          });
          toast.success("form resource added");
          goto(base + `/${key}`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        } finally {
        }
      } else {
        errormessage = "Form is invalid";
        loading = false;
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
  <Form.Field {form} name="collection" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>collection</Form.Label>
        <CollectionSelector {...props} bind:value={$formData.collection} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="name" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <CustomInput
          placeholder="name"
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="aggregates" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Aggregates</Form.Label>
        <ObjectInput {...props} bind:value={$formData.aggregates} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <HotkeyButton
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Create formresource"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create formresource</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
