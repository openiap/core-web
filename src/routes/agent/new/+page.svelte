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
  import { newFormSchema } from "../schema.js";
  import { zod } from "sveltekit-superforms/adapters";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { CollectionSelector } from "$lib/collectionselector/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import Timezoneselector from "$lib/timezoneselector/timezoneselector.svelte";
  import { auth } from "$lib/stores/auth.svelte";

  console.log("auth.config", auth.config);

  const key = "agent";
  let showdebug = $state(false);
  const { data } = $props();
  let errormessage = $state("");
  const form = superForm(data.form, {
    dataType: "json",
    validators: zod(newFormSchema),
  });

  const { form: formData, enhance, message } = form;

  let value = $state("");

  const triggerContent = $derived(
    () => auth.config.agent_images.find(
        (item: any) => item.name === $formData.image,
      )?.name ?? "Select an agent image",
  );
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

<form method="POST" use:enhance>
  <Form.Button aria-label="submit">Submit</Form.Button>
  <HotkeyButton onclick={() => goto(base + `/${key}`)}>Back</HotkeyButton>
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

  <Form.Field {form} name="slug">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>slug</Form.Label>
        <Input {...props} bind:value={$formData.slug} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your slug.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="image">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>image</Form.Label>
        <Select.Root {...props} type="single" bind:value={$formData.image}>
          <Select.Trigger class="w-[180px]">
            {triggerContent()}
          </Select.Trigger>
          <Select.Content>
            {#each auth.config.agent_images as image}
              <Select.Item value={image.name} label={image.name}
                >{image.name}</Select.Item
              >
            {/each}
          </Select.Content>
        </Select.Root>
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name of the image.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="plan">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>plan</Form.Label>
        <CollectionSelector {...props} bind:value={$formData.plan} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name of the plan.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="environment">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>environment</Form.Label>
        <ObjectInput {...props} bind:value={$formData.environment} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your environment.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="autostart"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox {...props} bind:checked={$formData.autostart} />
        <div class="space-y-1 leading-none">
          <Form.Label>autostart</Form.Label>
          <Form.Description>
            If enabled, the user is autostart and cannot signin
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
  </Form.Field>

  <Form.Field
    {form}
    name="webserver"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox {...props} bind:checked={$formData.webserver} />
        <div class="space-y-1 leading-none">
          <Form.Label>webserver</Form.Label>
          <Form.Description>
            If enabled, the user is webserver and cannot signin
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
  </Form.Field>

  <Form.Field
    {form}
    name="sleep"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox {...props} bind:checked={$formData.sleep} />
        <div class="space-y-1 leading-none">
          <Form.Label>sleep</Form.Label>
          <Form.Description>
            If enabled, the user is sleep and cannot signin
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
  </Form.Field>

  <Form.Field {form} name="timezone">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>timezone</Form.Label>
        <Timezoneselector {...props} bind:value={$formData.timezone} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name of the timezone.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="runas">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>runas</Form.Label>
        <Input {...props} bind:value={$formData.runas} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your runas.</Form.Description>
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
