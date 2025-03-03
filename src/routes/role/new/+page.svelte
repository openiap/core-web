<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import CustomSuperDebug from "$lib/customsuperdebug/customsuperdebug.svelte";
  import { CustomSwitch } from "$lib/customswitch/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

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
            item: { ...form.data },
            jwt: auth.access_token,
          });
          toast.success("Role added");
          goto(base + `/role`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        loading = false;
        toast.error("Error", {
          description: "Form is invalid",
        });
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
      projection: { name: 1, _id: 1 },
    });
    members.push({ _id: item._id, name: item.name });
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Form.Field {form} name="name" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <CustomInput
          disabled={loading}
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
    class="flex flex-row items-start space-x-3 space-y-0  mb-7"
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
                aria-label="Remove Member"
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
                }}><Trash2 />Remove Member</HotkeyButton
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

  <HotkeyButton
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Add Role"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Add Role</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
