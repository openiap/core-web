<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import SuperDebug, { superForm, defaults } from "sveltekit-superforms";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Trash2 } from "lucide-svelte";
  import { newFormSchema } from "../schema.js";
  import { zod } from "sveltekit-superforms/adapters";
  import { auth } from "$lib/stores/auth.svelte.js";

  const key = "user";
  let showdebug = $state(false);
  let loading = $state(false);
  let errormessage = $state("");
  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.InsertOne({
            collectionname: "users",
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

<form method="POST" use:enhance>
  <Form.Button disabled={loading} aria-label="submit">Submit</Form.Button>
  <HotkeyButton
    aria-label="back"
    disabled={loading}
    onclick={() => goto(base + `/${key}`)}>Back</HotkeyButton
  >
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
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="dblocked"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
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
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="validated"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.validated}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>validated</Form.Label>
          <Form.Description>
            Has user been email/form validated?
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="emailvalidated"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.emailvalidated}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>emailvalidated</Form.Label>
          <Form.Description>
            Has user been email/form validated?
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="formvalidated"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.formvalidated}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>formvalidated</Form.Label>
          <Form.Description>
            Has user been email/form validated?
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.federationids}
    {#each $formData.federationids as item, index}
      <div class="flex items-center">
        <Form.Field {form} name="federationids">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Federation id {index + 1}</Form.Label>
              {#if $formData.federationids}
                <Input
                  disabled={loading}
                  {...props}
                  bind:value={$formData.federationids[index]}
                />
              {/if}
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Button
          aria-label="delete"
          disabled={loading}
          variant="outline"
          onclick={() => {
            let arr = $formData.federationids;
            if (arr) {
              arr.splice(index, 1);
            }
            $formData.federationids = arr;
          }}><Trash2 /></Button
        >
      </div>
    {/each}
  {/if}
  <div>
    <Button
      aria-label="add federation id"
      disabled={loading}
      variant="outline"
      onclick={() => {
        let arr = $formData.federationids || [];
        $formData.federationids = [...arr, ""];
      }}>Add federation id</Button
    >
  </div>
  <Form.Button disabled={loading} aria-label="submit">Submit</Form.Button>
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
