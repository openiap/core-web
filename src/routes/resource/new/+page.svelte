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
  import * as Select from "$lib/components/ui/select/index.js";
  import { newFormSchema } from "../schema.js";
  import { zod } from "sveltekit-superforms/adapters";

  const key = "provider";
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

<div>Under contruction</div>

<div>
  Add {key}
</div>
<form method="POST" use:enhance>
  <Form.Button aria-label="submit">Submit</Form.Button>
  <HotkeyButton aria-label="back" onclick={() => goto(base + `/${key}`)}
    >Back</HotkeyButton
  >
  <Form.Field {form} name="target">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Target</Form.Label>
        <Select.Root
          type="single"
          bind:value={$formData.target}
          name={props.name}
        >
          <Select.Trigger {...props}>
            {$formData.target
              ? $formData.target
              : "Select a verified target to display"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="customer" label="m@support.com" />
            <Select.Item value="user" label="m@google.com" />
          </Select.Content>
        </Select.Root>
      {/snippet}
    </Form.Control>
    <!-- <Form.Description>
      You can manage email address in your <a href="/examples/forms"
        >email settings</a
      >.
    </Form.Description> -->
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
