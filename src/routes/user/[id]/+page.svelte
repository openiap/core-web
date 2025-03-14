<script lang="ts" module>
  export let collectionname = "users";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

  let loading = $state(false);

  const { data } = $props();
  data.item = editFormSchema.parse(data.item);

  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          if (form.data.newpassword === "") {
            // @ts-ignore
            delete form.data.newpassword;
          }
          await auth.client.UpdateOne({
            collectionname,
            item: { ...form.data },
            jwt: auth.access_token,
          });
          toast.success("User updated");
          goto(base + `/user`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        let errors = Object.keys(form.errors).map((key) => key + " is " + form.errors[key]);
        if(errors.length > 0) {
          toast.error("Error", {
            description: errors.join(", "),
          });
        } else {
          toast.error("Error", {
            description: "Form is invalid",
          });
        }
        cancel();
        loading = false;
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

<form method="POST" use:enhance>
  <Acl bind:value={$formData} />

  <Form.Field {form} name="name" class="mb-10">
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

  <Form.Field {form} name="username" class="mb-10">
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

  <Form.Field {form} name="newpassword" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Password</Form.Label>
        <CustomInput
          type="password"
          placeholder="Type new password"
          disabled={loading}
          {...props}
          bind:value={$formData.newpassword}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="email" class="mb-10">
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

  <Form.Field
    {form}
    name="disabled"
    class="flex flex-row items-start space-x-3 space-y-0 mb-10 "
  >
    <Form.Control>
      {#snippet children({ props })}
        <CustomCheckbox
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-10"
  >
    <Form.Control>
      {#snippet children({ props })}
        <CustomCheckbox
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-10"
  >
    <Form.Control>
      {#snippet children({ props })}
        <CustomCheckbox
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-10"
  >
    <Form.Control>
      {#snippet children({ props })}
        <CustomCheckbox
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-10"
  >
    <Form.Control>
      {#snippet children({ props })}
        <CustomCheckbox
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
    <div class="mb-10">
      {#each $formData.federationids as item, index}
        <div class="flex items-center justify-start">
          {index + 1}.
          {item.id}
          {item.issuer}
          <HotkeyButton
            class="ml-2 dark:bg-darkbgred"
            aria-label="Delete"
            size="base"
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
      {/each}
    </div>
  {/if}

  <HotkeyButton
    type="submit"
    disabled={loading}
    aria-label="Update User"
    variant="success"
    size="base"
    data-shortcut="ctrl+s"
  >
    <Check />
    Update User</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
