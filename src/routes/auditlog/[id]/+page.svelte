<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  // import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Trash2 } from "lucide-svelte";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  const key = "auditlog";
  let showdebug = $state(false);
  const { data } = $props();
  const form = superForm(data.form, { dataType: "json" });
  const { form: formData, enhance, message } = form;
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div>Under contruction</div>

<div>
  Edit {key}
</div>

<form method="POST" use:enhance>
  <Form.Button>Submit</Form.Button>
  <HotkeyButton onclick={() => goto(base + `/${key}`)}>Back</HotkeyButton>
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

  <Form.Field {form} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input {...props} bind:value={$formData.email} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the email.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <div>
    <Button
      variant="outline"
      onclick={() => {
        let arr = $formData.domains || [];
        $formData.domains = [...arr, ""];
      }}>Add domain</Button
    >
  </div>

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
