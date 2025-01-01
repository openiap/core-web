<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Acl from "$lib/acl/acl.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { Input } from "$lib/components/ui/input/index.js";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { ArrowLeft, Check, Plus, Trash2 } from "lucide-svelte";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";
    import { toast } from "svelte-sonner";

  const key = "role";
  let showdebug = $state(false);
  let errormessage = $state("");
  let loading = $state(false);
  let newid = $state("");
  let members: any = $state([]);

  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          if (members.length > 0) {
            form.data.members = members;
          }
          if (!form.data.rparole) {
            delete form.data.rparole;
          }
          if (!form.data.hidemembers) {
            delete form.data.hidemembers;
          }
          await auth.client.InsertOne({
            collectionname: "users",
            item: { ...form.data, _type: "role" },
            jwt: auth.access_token,
          });
          goto(base + `/${key}`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        } finally {
          loading = false;
        }
      }
    },
  });
  const { form: formData, enhance, message } = form;
  $formData.rparole = false;
  $formData.hidemembers = false;

  async function addace(id: string) {
    var item = await auth.client.FindOne<any>({
      collectionname: "users",
      query: { _id: id },
      jwt: auth.access_token,
    });
  }
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

<div class="font-bold mb-4">
  Add {key}
</div>
<form method="POST" use:enhance>
  <HotkeyButton
    aria-label="back"
    disabled={loading}
    onclick={() => goto(base + `/${key}`)}
  >
    <ArrowLeft />
    Back</HotkeyButton
  >
  <Form.Button aria-label="submit" disabled={loading}>
    <Check />
    Submit</Form.Button
  >

  <Acl bind:value={$formData} open="item-1" />

  <Form.Field {form} name="name" class="mb-4">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input disabled={loading} {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="rparole"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-4">
          <Form.Label>RPA Role</Form.Label>
          <div class="flex items-center space-x-4">
            <Switch
              disabled={loading}
              bind:checked={$formData.rparole}
              {...props}
              aria-readonly
            />
            <span> {$formData.rparole ? "On" : "Off"} </span>
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="hidemembers"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-4">
          <Form.Label>Hide Members</Form.Label>
          <div class="flex items-center space-x-4">
            <Switch
              disabled={loading}
              bind:checked={$formData.hidemembers}
              {...props}
              aria-readonly
            />
            <span> {$formData.hidemembers ? "On" : "Off"} </span>
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <div class="mb-4">
    {#if members}
      <div class="mb-4">
        {#each members as item, index}
          <div class="flex items-center space-x-4">
            <div class="font-bold">Member</div>
            {#if item}
              <div>
                {item.name}
              </div>
            {/if}

            <Button
              aria-label="delete"
              disabled={loading}
              variant="outline"
              onclick={() => {
                let arr = members;
                if (arr) {
                  arr.splice(index, 1);
                }
                members = arr;
              }}><Trash2 /></Button
            >
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex space-x-2 mb-4">
      <EntitySelector bind:value={newid} collectionname="users"
      ></EntitySelector>
      <Button
        onclick={async () => {
          await addace(newid);
        }}
      >
        <Plus />
        Add
      </Button>
    </div>
  </div>

  <Form.Button aria-label="submit" disabled={loading} class="mb-4">
    <Check />
    Submit</Form.Button
  >
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
