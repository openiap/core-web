<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  import { _userSchema, type UserSchema } from "./+page";
  import {
    type SuperValidated,
    type Infer,
    superForm,
    setError,
  } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { type FormPath } from 'sveltekit-superforms'

  const { data } = $props();
  let errormessage = $state("");
  const form = superForm(data.form, {
    validators: zodClient(_userSchema),
    onUpdate(e) {
      if(!e.form.valid) return;

      errormessage = "Go away";
      e.cancel();
      return;
      console.log("valid", e.form.valid);
      console.log("data", e.form.data);
      auth.client.InsertOne({collectionname: "users", item: {...e.form.data, _type: "role"}}).
      finally(() => {
        goto(base + "/role");
      }).catch((e) => {
        console.error(e);
      });
      e.cancel();
    },
    dataType: "json",
    SPA: true,
  });

  const { form: formData, enhance } = form;
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

<form method="POST" use:enhance>
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
  <Form.Field {form} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input {...props} bind:value={$formData.email} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your email.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
  <Form.Button>Submit</Form.Button>
</form>
