<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

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
  <Acl bind:value={$formData} {loading} />

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
            <div class="text-[14px]">{$formData.rparole ? "On" : "Off"}</div>
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
            <div class="text-[14px]">
              {$formData.hidemembers ? "On" : "Off"}
            </div>
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if members.length > 0}
    <div
      class="text-[14px] w-[895px] mb-7 border rounded-[10px] dark:bg-bw850 dark:border-bw600 px-2.5 py-1"
    >
      <div class="mb-5 dark:text-bw400">
        This user is a member of the following:
      </div>
      {#if members.length > 0}
        {#each members as item, index}
          <div
            class="grid grid-cols-12 items-center border px-2.5 py-[5px] my-2.5 rounded-[10px] dark:border-bw600 dark:bg-bw1000"
          >
            <div class="dark:text-bw400 col-span-1">Member</div>
            {#if item}
              <div class="col-span-4">
                {item.name}
              </div>
            {/if}
            <div class="col-span-3">
              <HotkeyButton
                aria-label="delete"
                class="dark:bg-darkbgred"
                disabled={loading}
                variant="danger"
                size="base"
                onclick={() => {
                  let arr = members;
                  if (arr) {
                    arr.splice(index, 1);
                  }
                  members = arr;
                }}><Trash2 />Remove Rights</HotkeyButton
              >
            </div>
            <div class="col-span-4">
              <span class="dark:text-bw400">Role id :</span>
              <span>{item._id}</span>
            </div>
          </div>
        {/each}
      {:else}
        <div class="dark:text-bw400">No members</div>
      {/if}
    </div>
  {/if}

  <div class="flex space-x-2 mb-7">
    <EntitySelector bind:value={newid} collectionname="users" {loading}
    ></EntitySelector>
    <HotkeyButton
      variant="success"
      size="base"
      disabled={loading || newid == ""}
      onclick={async () => {
        if (newid) {
          await addace(newid);
          newid = "";
        }
      }}
    >
      <Plus />
      Add
    </HotkeyButton>
  </div>

  <Form.Button
    variant="success"
    size="new"
    disabled={loading}
    aria-label="submit"
  >
    <Check />
    Update {key}</Form.Button
  >
</form>

<CustomSuperDebug {formData} />
