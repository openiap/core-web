<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

  let loading = $state(false);

  const { data } = $props();

  if (data.item != null) {
    data.item = editFormSchema.parse(data.item);
  }

  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          if (form.data.clientId == null) {
            form.data.clientId = "";
          } else {
            form.data.clientId = form.data.clientId.split(" ").join("");
          }

          await auth.client.UpdateOne({
            collectionname: "config",
            item: form.data,
            jwt: auth.access_token,
          });
          toast.success("OAuth client updated");
          goto(base + `/oauthclient`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        let errors = Object.keys(form.errors).map(
          (key) => key + " is " + form.errors[key],
        );
        if (errors.length > 0) {
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
  try {
    formData.set(data.item);
    validateForm({ update: true });
  } catch (error: any) {
    toast.error("Error while enhancing", {
      description: error.message,
    });
  }

  let keys = $state(Object.keys($formData.rolemappings || {}));
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <!-- <Acl bind:value={$formData} {loading} /> -->

  <Form.Field {form} name="name" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <CustomInput
          disabled={loading}
          placeholder="Type name"
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="clientId" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Client Id</Form.Label>
        <CustomInput
          disabled={loading}
          placeholder="Type clientId"
          {...props}
          bind:value={$formData.clientId}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="clientSecret" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Client Secret</Form.Label>
        <CustomInput
          type="password"
          disabled={loading}
          placeholder="Type clientSecret"
          {...props}
          bind:value={$formData.clientSecret}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.grants}
    <div class="mb-4">Grants</div>
    {#each $formData.grants as item, index}
      <Form.Field {form} name="grants" class="mb-4">
        <Form.Control>
          {#snippet children({ props })}
            {#if $formData.grants}
              <div class="flex items-center justify-start">
                <CustomInput
                  placeholder="New grant"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.grants[index]}
                />
                <HotkeyButton
                  class="ml-2 dark:bg-darkbgred"
                  aria-label="Delete"
                  size="base"
                  disabled={loading}
                  variant="icon"
                  onclick={() => {
                    let arr = $formData.grants;
                    if (arr) {
                      arr.splice(index, 1);
                    }
                    $formData.grants = arr;
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
      class="mb-10"
      aria-label="Add Grant"
      disabled={loading}
      variant="base"
      size="base"
      onclick={() => {
        let arr = $formData.grants || [];
        // @ts-ignore
        $formData.grants = [...arr, "New field"];
      }}
    >
      <Plus />
      Add Grant</HotkeyButton
    >
  </div>

  {#if $formData.redirectUris}
    <div class="mb-4">Redirect Uris</div>
    {#each $formData.redirectUris as item, index}
      <Form.Field {form} name="redirectUris" class="mb-4">
        <Form.Control>
          {#snippet children({ props })}
            {#if $formData.redirectUris}
              <div class="flex items-center justify-start">
                <CustomInput
                  placeholder="New redirect uris"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.redirectUris[index]}
                />
                <HotkeyButton
                  class="ml-2 dark:bg-darkbgred"
                  aria-label="Delete"
                  size="base"
                  disabled={loading}
                  variant="icon"
                  onclick={() => {
                    let arr = $formData.redirectUris;
                    if (arr) {
                      arr.splice(index, 1);
                    }
                    $formData.redirectUris = arr;
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
      class="mb-10"
      aria-label="Add Grant"
      disabled={loading}
      variant="base"
      size="base"
      onclick={() => {
        let arr = $formData.redirectUris || [];
        // @ts-ignore
        $formData.redirectUris = [...arr, "New field"];
      }}
    >
      <Plus />
      Add Redirect Uris</HotkeyButton
    >
  </div>

  <Form.Field {form} name="defaultrole" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Default Role</Form.Label>
        <CustomInput
          disabled={loading}
          placeholder="Type default role"
          {...props}
          bind:value={$formData.defaultrole}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <!-- <Form.Field {form} name="rolemappings" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>rolemappings</Form.Label>
        <Objectinput
          placeholder="Type rolemappings"
          {...props}
          bind:value={$formData.rolemappings}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field> -->

  {#if $formData.rolemappings}
    <div class="mb-4">Role Mappings</div>
    {#each keys as key, index}
      <div class="flex gap-2 mb-2 items-end">
        <div class="flex flex-col">
          <div>OpenCore Role</div>
          <CustomInput
            width="w-full"
            placeholder="Key"
            bind:value={keys[index]}
            on:input={(e) => {
              const newKey = e.target.value;
              const val = $formData.rolemappings[key];
              delete $formData.rolemappings[key];
              $formData.rolemappings[newKey] = val;
            }}
            disabled={loading}
          />
        </div>
        <div class="flex flex-col">
          <div>Target Role</div>
          <CustomInput
            width="w-full"
            placeholder="Value"
            bind:value={$formData.rolemappings[key]}
            disabled={loading}
          />
        </div>
        <HotkeyButton
          class="ml-2 dark:bg-darkbgred"
          aria-label="Delete"
          size="base"
          disabled={loading}
          variant="icon"
          onclick={() => {
            delete $formData.rolemappings[key];
            $formData.rolemappings = $formData.rolemappings;
            keys = Object.keys($formData.rolemappings);
          }}><Trash2 /></HotkeyButton
        >
      </div>
    {/each}
  {/if}
  <div>
    <HotkeyButton
      class="mb-10"
      aria-label="Add Role Mappings"
      disabled={loading}
      variant="base"
      size="base"
      onclick={() => {
        $formData.rolemappings[""] = "";
        keys = Object.keys($formData.rolemappings);
      }}
    >
      <Plus />
      Add Role Mapping
    </HotkeyButton>
  </div>

  <Form.Field {form} name="token_endpoint_auth_method" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Token Endpoint Auth Method</Form.Label>
        <CustomSelect
          {loading}
          type="single"
          bind:value={$formData.token_endpoint_auth_method}
          triggerContent={() => {
            if ($formData.token_endpoint_auth_method == "") {
              return "none";
            } else {
              return $formData.token_endpoint_auth_method;
            }
          }}
          selectitems={[
            { name: "none", value: "" },
            { name: "client_secret_post", value: "client_secret_post" },
            { name: "client_secret_basic", value: "client_secret_basic" },
            { name: "private_key_jwt", value: "private_key_jwt" },
            { name: "tls_client_auth", value: "tls_client_auth" },
          ]}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="signin_url" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Signin Url</Form.Label>
        <CustomInput
          disabled={loading}
          placeholder="Type signin url"
          {...props}
          bind:value={$formData.signin_url}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.response_types}
    <div class="mb-4">Response Types</div>
    {#each $formData.response_types as item, index}
      <Form.Field {form} name="response_types" class="mb-4">
        <Form.Control>
          {#snippet children({ props })}
            {#if $formData.response_types}
              <div class="flex items-center justify-start">
                <CustomInput
                  placeholder="New response types"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.response_types[index]}
                />
                <HotkeyButton
                  class="ml-2 dark:bg-darkbgred"
                  aria-label="Delete"
                  size="base"
                  disabled={loading}
                  variant="icon"
                  onclick={() => {
                    let arr = $formData.response_types;
                    if (arr) {
                      arr.splice(index, 1);
                    }
                    $formData.response_types = arr;
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
      class="mb-10"
      aria-label="Add Response Type"
      disabled={loading}
      variant="base"
      size="base"
      onclick={() => {
        let arr = $formData.response_types || [];
        // @ts-ignore
        $formData.response_types = [...arr, "New field"];
      }}
    >
      <Plus />
      Add Response Types</HotkeyButton
    >
  </div>

  {#if $formData.post_logout_redirect_uris}
    <div class="mb-4">Post Logout Redirect Uris</div>
    {#each $formData.post_logout_redirect_uris as item, index}
      <Form.Field {form} name="post_logout_redirect_uris" class="mb-4">
        <Form.Control>
          {#snippet children({ props })}
            {#if $formData.post_logout_redirect_uris}
              <div class="flex items-center justify-start">
                <CustomInput
                  placeholder="New post logout redirect uris"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.post_logout_redirect_uris[index]}
                />
                <HotkeyButton
                  class="ml-2 dark:bg-darkbgred"
                  aria-label="Delete"
                  size="base"
                  disabled={loading}
                  variant="icon"
                  onclick={() => {
                    let arr = $formData.post_logout_redirect_uris;
                    if (arr) {
                      arr.splice(index, 1);
                    }
                    $formData.post_logout_redirect_uris = arr;
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
      class="mb-10"
      aria-label="Add post logout redirect uris"
      disabled={loading}
      variant="base"
      size="base"
      onclick={() => {
        let arr = $formData.post_logout_redirect_uris || [];
        // @ts-ignore
        $formData.post_logout_redirect_uris = [...arr, "New field"];
      }}
    >
      <Plus />
      Add Post Logout Redirect Uris</HotkeyButton
    >
  </div>

  <HotkeyButton
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Update OAuth Client"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Update OAuth Client</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
