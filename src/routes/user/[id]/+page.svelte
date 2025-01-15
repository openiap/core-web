<script lang="ts" module>
  export let collectionname = "users";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Trash2, UserRoundPlus } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

  const key = "user";
  let loading = $state(false);
  let errormessage = $state("");
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
            item: { ...form.data },
            jwt: auth.access_token,
          });
          toast.success("User updated");
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

  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Acl bind:value={$formData} />

  <Form.Field {form} name="name" class="mb-7">
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

  <Form.Field {form} name="username" class="mb-7">
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

  {#if "password" in $formData}
    <Form.Field {form} name="password" class="mb-7">
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
  {/if}

  {#if "email" in $formData && $formData.email == ""}
    <Form.Field {form} name="email" class="mb-7">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Email</Form.Label>
          <CustomInput
            placeholder="Type email"
            disabled={loading}
            {...props}
            bind:value={$formData.email}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  {/if}

  {#if "disabled" in $formData && $formData.disabled != null}
    <Form.Field
      {form}
      name="disabled"
      class="flex flex-row items-start space-x-3 space-y-0 mb-7 "
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
  {/if}

  <Form.Field
    {form}
    name="dblocked"
    class="flex flex-row items-start space-x-3 space-y-0 mb-7"
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-7"
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-7"
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-7"
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
                  placeholder="Federation email"
                  type="email"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.federationids[index]}
                />
                <Hotkeybutton
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
                  }}><Trash2 /></Hotkeybutton
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
    <Hotkeybutton
      class="mb-7"
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
      Add federation id</Hotkeybutton
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
    Update {key}</Form.Button
  >
</form>

<CustomSuperDebug {formData} />

<!-- issues
In some users object 
1. Password key missing
2. Email is null instead of string
3. Disabled check is either null or missing 
Schema is conflicting with the data object hence edit user is not working 

-CURRENT SOLUTION
Addded if checks to handle the missing keys in the object
-->
