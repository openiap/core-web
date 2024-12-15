<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Trash2 } from "lucide-svelte";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  import { newFormSchema } from "../schema.js";
  import { zod } from "sveltekit-superforms/adapters";
    import { Acl } from "$lib/acl/index.js";

  const key = "customer";
  let showdebug = $state(false);
  const { data } = $props();
  const form = superForm(data.form, {
    dataType: "json",
    validators: zod(newFormSchema),
  });
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
  <Form.Button aria-label="submit">Submit</Form.Button>
  <HotkeyButton aria-label="Back" onclick={() => goto(base + `/${key}`)}>Back</HotkeyButton>

  <Acl bind:value={$formData} />

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

  {#if $formData.domains}
    {#each $formData.domains as item, index}
      <div class="flex items-center">
        <Form.Field {form} name="domains">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Domain {index + 1}</Form.Label>
              {#if $formData.domains}
                <Input {...props} bind:value={$formData.domains[index]} />
              {/if}
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Button
          aria-label="Delete domain"
          variant="outline"
          onclick={() => {
            let arr = $formData.domains;
            if (arr) {
              arr.splice(index, 1);
            }
            $formData.domains = arr;
          }}><Trash2 /></Button
        >
      </div>
    {/each}
  {/if}
  <div>
    <Button
      aria-label="Add domain"
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
