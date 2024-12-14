<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { Input } from "$lib/components/ui/input/index.js";
  import SuperDebug, { superForm, defaults } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newUserSchema } from "../schema.js";
  import { auth } from "$lib/stores/auth.svelte.js";

  const key = "role";
  let showdebug = $state(false);
  const { data } = $props();
  let errormessage = $state("");
  let loading = $state(false);

  const form = superForm(defaults(zod(newUserSchema)), {
    dataType: "json",
    validators: zod(newUserSchema),
    SPA: true,
    onUpdate: async ({ form, cancel  }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.InsertOne({ collectionname: "users", item: { ...form.data, _type: "role" }, jwt: auth.access_token });
          goto(base + `/${key}`);          
       } catch (error:any) {
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
  <Form.Button aria-label="submit" disabled={loading} >Submit</Form.Button>
  <HotkeyButton aria-label="back" disabled={loading} onclick={() => goto(base + `/${key}`)}
    >Back</HotkeyButton
  >
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input disabled={loading} {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
  <Form.Field {form} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input disabled={loading} {...props} bind:value={$formData.email} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your email.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
  <Form.Button aria-label="submit" disabled={loading}>Submit</Form.Button>
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
