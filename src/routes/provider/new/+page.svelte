<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Trash2 } from "lucide-svelte";

  const key = "provider";
  let showdebug = $state(false);
  const { data } = $props();
  let errormessage = $state("");
  const form = superForm(data.form);
  const { form: formData, enhance, message } = form;
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

<div>
  Add {key}
</div>
<HotkeyButton aria-label="back" onclick={() => goto(base + `/${key}`)}
  >Back</HotkeyButton
>
<form method="POST" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your public display name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="id">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Id</Form.Label>
        <Input {...props} bind:value={$formData.id} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your id.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.forceddomains}
    {#each $formData.forceddomains as item, index}
      <div class="flex items-center">
        <Form.Field {form} name="forceddomains">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Forced domain {index + 1}</Form.Label>
              {#if $formData.forceddomains}
                <Input {...props} bind:value={$formData.forceddomains[index]} />
              {/if}
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Button
          variant="outline"
          onclick={() => {
            let arr = $formData.forceddomains;
            if (arr) {
              arr.splice(index, 1);
            }
            $formData.forceddomains = arr;
          }}><Trash2 /></Button
        >
      </div>
    {/each}
  {/if}
  <div>
    <Button
      variant="outline"
      aria-label="add forced domains"
      onclick={() => {
        let arr = $formData.forceddomains || [];
        $formData.forceddomains = [...arr, ""];
      }}>Add Forced Domain</Button
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
  aria-label="toggle debug"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
