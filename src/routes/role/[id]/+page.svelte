<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { ArrowLeft, Check, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";

  const key = "role";
  let loading = $state(false);
  let errormessage = $state("");
  let newid = $state("");
  let members: any = $state([]);

  const { data } = $props();
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
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
          console.log(form.data);
          await auth.client.UpdateOne({
            collectionname: "users",
            item: form.data,
            jwt: auth.access_token,
          });
          toast.success("Role updated");
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
  members = $formData.members;
  if (!("rparole" in $formData)) {
    $formData.rparole = false;
  }
  if (!("hidemembers" in $formData)) {
    $formData.hidemembers = false;
  }
  console.log($formData);

  async function addace(id: string) {
    var item = await auth.client.FindOne<any>({
      collectionname: "users",
      query: { _id: id },
      jwt: auth.access_token,
      projection: { name: 1, _id: 1 },
    });
    members.push({ _id: item._id, name: item.name });
  }
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
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="rparole"
    class="flex flex-row items-start space-x-3 space-y-0 mb-7"
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-4">
          <div class="flex items-center space-x-2">
            <CustomSwitch
              {loading}
              bind:checked={$formData.rparole}
              {...props}
              aria-readonly
            />
            <Form.Label>RPA Role</Form.Label>
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-7"
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-4">
          <div class="flex items-center space-x-2">
            <CustomSwitch
              {loading}
              bind:checked={$formData.hidemembers}
              {...props}
              aria-readonly
            />
            <Form.Label>Hide Members</Form.Label>
            <span> {$formData.hidemembers ? "On" : "Off"} </span>
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <div class="mb-7">
    {#if members}
      <div class="mb-7">
        {#each members as item, index}
          <div class="flex items-center space-x-4">
            <div class="font-bold">Member</div>
            {#if item}
              <div>
                {item.name}
              </div>
            {/if}

            <HotkeyButton
              aria-label="delete"
              disabled={loading}
              variant="outline"
              onclick={() => {
                let arr = members;
                if (arr) {
                  arr.splice(index, 1);
                }
                members = arr;
              }}><Trash2 /></HotkeyButton
            >
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex space-x-2 mb-7">
      <EntitySelector bind:value={newid} collectionname="users"
      ></EntitySelector>
      <HotkeyButton
        onclick={async () => {
          await addace(newid);
        }}
      >
        <Plus />
        Add
      </HotkeyButton>
    </div>
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
