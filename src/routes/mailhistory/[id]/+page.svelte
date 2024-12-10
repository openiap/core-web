<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  import { editFormSchema } from "../schema.js";
  import { zod } from "sveltekit-superforms/adapters";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import * as Table from "$lib/components/ui/table/index.js";
    import { Acl } from "$lib/acl/index.js";

  const key = "mailhistory";
  let showdebug = $state(false);
  const { data } = $props();
  const form = superForm(data.form, {
    dataType: "json",
    validators: zod(editFormSchema),
  });
  const { form: formData, enhance, message } = form;
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

  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your public name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="marketing_emails"
    class="flex flex-row items-center justify-between rounded-lg border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="space-y-0.5">
          <Form.Label>Read</Form.Label>
          <Form.Description>
            This lets you know if the email has been read by the recipient.
          </Form.Description>
        </div>
        <Switch {...props} checked={$formData.readcount} disabled />
      {/snippet}
    </Form.Control>
  </Form.Field>

  <div>Email Access details</div>

  {#if $formData.opened.length !== 0}
    <Table.Root>
      <!-- <Table.Caption>Email Access details</Table.Caption> -->
      <Table.Header>
        <Table.Row>
          <Table.Head class="font-medium">S No.</Table.Head>
          <Table.Head class="font-medium">Date</Table.Head>
          <Table.Head>IP Address</Table.Head>
          <Table.Head>Agent</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each $formData.opened as item, index}
          <Table.Row>
            <Table.Cell>{index + 1}</Table.Cell>
            <Table.Cell>{item.dt}</Table.Cell>
            <Table.Cell>{item.ip}</Table.Cell>
            <Table.Cell>{item.agent}</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
      <!-- <Table.Footer>
        <Table.Row>
          <Table.Cell colspan={3}>Total</Table.Cell>
          <Table.Cell class="text-right">$2,500.00</Table.Cell>
        </Table.Row>
      </Table.Footer> -->
    </Table.Root>
  {/if}

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
