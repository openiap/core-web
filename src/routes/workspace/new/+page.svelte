<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Trash2 } from "lucide-svelte";
  import { newFormSchema } from "../schema.js";
  import { zod } from "sveltekit-superforms/adapters";
  
  const key = "customer";
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
<form method="POST" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Workspace Name</Form.Label>
        <Input {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name of your new workspace.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button aria-label="Create workspace">Create workspace</Form.Button>
  <HotkeyButton aria-label="Cancel" onclick={() => goto(base + `/${key}`)}>Cancel</HotkeyButton>
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
