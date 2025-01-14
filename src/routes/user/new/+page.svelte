<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Trash2, UserRoundPlus } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

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
            item: { ...form.data },
            jwt: auth.access_token,
          });
          toast.success("User added");
          goto(base + `/${key}`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        } finally {
        }
      } else {
        errormessage = "Form is invalid";
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

<form method="POST" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <CustomInput
          placeholder="Type name"
          disabled={loading}
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="username">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Username</Form.Label>
        <CustomInput
          placeholder="Type username"
          disabled={loading}
          {...props}
          bind:value={$formData.username}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="password">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Password</Form.Label>
        <CustomInput
          type="password"
          placeholder="Type password"
          disabled={loading}
          {...props}
          bind:value={$formData.password}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="email" class="mb-4">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <CustomInput
          type="email"
          placeholder="Type email"
          disabled={loading}
          {...props}
          bind:value={$formData.email}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="disabled"
    class="flex flex-row items-start space-x-3 space-y-0 mb-4 "
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.disabled}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Disabled</Form.Label>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="dblocked"
    class="flex flex-row items-start space-x-3 space-y-0 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.dblocked}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>DB locked</Form.Label>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="validated"
    class="flex flex-row items-start space-x-3 space-y-0 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.validated}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Validated</Form.Label>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="emailvalidated"
    class="flex flex-row items-start space-x-3 space-y-0 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.emailvalidated}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Email Validated</Form.Label>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="formvalidated"
    class="flex flex-row items-start space-x-3 space-y-0 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.formvalidated}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Form Validated</Form.Label>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.federationids}
    {#each $formData.federationids as item, index}
      <Form.Field {form} name="federationids">
        <Form.Control>
          {#snippet children({ props })}
            <!-- <Form.Label>Federation id {index + 1}</Form.Label> -->
            {#if $formData.federationids}
              <div class="flex items-center justify-start">
                <CustomInput
                  disabled={loading}
                  {...props}
                  bind:value={$formData.federationids[index]}
                />
                <HotkeyButton
                  class="ml-2 dark:bg-darkbgred"
                  aria-label="delete"
                  size="new"
                  disabled={loading}
                  variant="icon"
                  onclick={() => {
                    let arr = $formData.federationids;
                    if (arr) {
                      arr.splice(index, 1);
                    }
                    $formData.federationids = arr;
                  }}><Trash2 /></HotkeyButton
                >
              </div>
            {/if}
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    {/each}
  {/if}
  <div>
    <HotkeyButton
      class="mb-4"
      aria-label="add federation id"
      disabled={loading}
      variant="new"
      size="new"
      onclick={() => {
        let arr = $formData.federationids || [];
        $formData.federationids = [...arr, "test"];
      }}
    >
      <UserRoundPlus />
      Add federation id</HotkeyButton
    >
  </div>

  <Form.Button
    disabled={loading}
    aria-label="submit"
    variant="new"
    size="new"
    class="dark:bg-darkbggreen"
  >
    <Check />
    Add {key}</Form.Button
  >
</form>

{#if formData != null && showdebug == true}
  <div class="mt-4">
    <SuperDebug data={formData} theme="vscode" />
  </div>
{/if}

<HotkeyButton
  hidden
  class="hidden"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
