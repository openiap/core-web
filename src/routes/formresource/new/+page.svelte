<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { CollectionSelector } from "$lib/collectionselector/index.js";
  
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  // import Button from "$lib/components/ui/button/button.svelte";
  // import { Trash2 } from "lucide-svelte";
  import { newFormSchema } from "../schema.js";
  import { zod } from "sveltekit-superforms/adapters";

  const title = "Form Resource";
  const key = "formresource";
  let showdebug = $state(false);
  const { data } = $props();
  let errormessage = $state("");
  const form = superForm(data.form, {
    dataType: "json",
    validators: zod(newFormSchema),
  });
  const { form: formData, enhance, message } = form;
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

<div>
  Add {title}
</div>

<form method="POST" use:enhance>
  <Form.Button aria-label="submit">Submit</Form.Button>
  <HotkeyButton onclick={() => goto(base + `/${key}`)}>Back</HotkeyButton>
  
  <Form.Field {form} name="collection">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>collection</Form.Label>
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
    <Form.Description>This is your aggregates.</Form.Description>
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
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
