<script lang="ts" module>
  export let collectionname = "forms";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl/index.js";
  import { CollectionSelector } from "$lib/collectionselector/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { toast } from "svelte-sonner";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

  const key = "formresource";
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
            collectionname: "forms",
            item: form.data,
            jwt: auth.access_token,
          });
          toast.success("Form resource edited");
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
  <Form.Button aria-label="submit">Submit</Form.Button>
  <HotkeyButton aria-label="back" onclick={() => goto(base + `/${key}`)}
    >Back</HotkeyButton
  >

  <Acl bind:value={$formData} />

  <Form.Field {form} name="collection">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Collection</Form.Label>
        <CollectionSelector {...props} bind:value={$formData.collection} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name of the collection.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

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

  <Form.Field {form} name="aggregates">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Aggregates</Form.Label>
        <ObjectInput {...props} bind:value={$formData.aggregates} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the aggregates.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button aria-label="submit">Submit</Form.Button>
</form>

{#if formData != null && showdebug == true}
  <SuperDebug data={formData} theme="vscode" />
{/if}

<HotkeyButton
  hidden
  class="hidden"
  aria-label="Toggle debug"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
