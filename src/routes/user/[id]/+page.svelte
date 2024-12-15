<script lang="ts" module>
  export let collectionname = "users";
</script>
<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Acl } from "$lib/acl";
  import { auth } from "$lib/stores/auth.svelte.js";

  import SuperDebug, { superForm, defaults } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

  const key = "user";
  let loading = $state(false);
  let errormessage = $state("");
  let showdebug = $state(false);
  const { data } = $props();
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.UpdateOne({
            collectionname,
            item: { ...form.data, _type: "user" },
            jwt: auth.access_token,
          });
          goto(base + `/${key}`);
        } catch (error: any) {
          errormessage = error.message;
          cancel();
        } finally {
          loading = false;
        }
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
  <Form.Button disabled={loading} aria-label="submit">Submit</Form.Button>
  <HotkeyButton
    disabled={loading}
    aria-label="back"
    onclick={() => goto(base + `/${key}`)}>Back</HotkeyButton
  >

  <Acl bind:value={$formData} />

  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input disabled={loading} {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your public display name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="username">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Username</Form.Label>
        <Input disabled={loading} {...props} bind:value={$formData.username} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your username.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="password">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Password</Form.Label>
        <Input
          disabled={loading}
          {...props}
          bind:value={$formData.password}
          type="password"
        />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your password.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input
          disabled={loading}
          {...props}
          bind:value={$formData.email}
          type="email"
        />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your email.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="disabled"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        {#if $formData.disabled != null}
          <Checkbox
            disabled={loading}
            {...props}
            bind:checked={$formData.disabled}
          />
          <div class="space-y-1 leading-none">
            <Form.Label>disabled</Form.Label>
            <Form.Description>
              If enabled, the user is disabled and cannot signin
            </Form.Description>
          </div>
        {/if}
      {/snippet}
    </Form.Control>
  </Form.Field>

  <Form.Field
    {form}
    name="dblocked"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        {#if $formData.disabled != null}
          <Checkbox
            disabled={loading}
            {...props}
            bind:checked={$formData.dblocked}
          />
          <div class="space-y-1 leading-none">
            <Form.Label>dblocked</Form.Label>
            <Form.Description>
              If enabled, the user is can only login using web interface and
              cannot add more data to the database
            </Form.Description>
          </div>
        {/if}
      {/snippet}
    </Form.Control>
  </Form.Field>

  <Form.Field
    {form}
    name="validated"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        {#if $formData.disabled != null}
          <Checkbox
            disabled={loading}
            {...props}
            bind:checked={$formData.validated}
          />
          <div class="space-y-1 leading-none">
            <Form.Label>Validated</Form.Label>
            <Form.Description>
              Has user been email/form validated?
            </Form.Description>
          </div>
        {/if}
      {/snippet}
    </Form.Control>
  </Form.Field>

  <Form.Button disabled={loading} aria-label="submit">Submit</Form.Button>
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
