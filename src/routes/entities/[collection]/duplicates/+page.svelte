<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { History, Pencil, Trash2 } from "lucide-svelte";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import Entities from "$lib/entities/entities.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";

  let loading = $state(false);
  let errormessage = $state("");
  const { data } = $props();
  let collectionname = $state("");
  let query = $state([]);
  collectionname = data.collection;
  let ref: any;
  let page = $derived(() => "entities-" + collectionname + "-duplicates");
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);

  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      loading = true;
      if (form.valid) {
        try {
          // await auth.client.UpdateOne({
          //   collectionname: collectionname,
          //   item: { ...form.data, _id: id },
          //   jwt: auth.access_token,
          // });
          toast.success(collectionname + " updated");
          // goto(base + `/entities`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        } finally {
          loading = false;
        }
      } else {
        loading = false;
        errormessage = "Form is invalid";
      }
    },
  });

  const { form: formData, enhance, message, validateForm } = form;
  formData.set({ name: "new item", _type: "test" });
  validateForm({ update: true });
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

<form method="POST" use:enhance>
  <Form.Field {form} name="name" class="mb-2">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Mongodb Query</Form.Label>
        <CustomInput placeholder="Mongodb query" bind:value={query} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
  <div class="flex space-x-4 justify-between items-center mb-2">
    <div class="flex items-center space-x-2">
      <Form.Field {form} name="name">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Uniqueness</Form.Label>
            <CustomInput placeholder="" width="w-full" />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <div class="flex items-center space-x-2">
        <CustomCheckbox />
        <div>Include 1's</div>
      </div>
    </div>
    <div class="flex items-center space-x-4">
      <HotkeyButton>
        <Trash2 /> One
      </HotkeyButton>
      <HotkeyButton>
        <Trash2 /> All but One
      </HotkeyButton>
      <HotkeyButton>
        <Trash2 /> All
      </HotkeyButton>
    </div>
  </div>
</form>

<Entities
  {collectionname}
  {query}
  page={page()}
  total_count={data.total_count}
  bind:searchstring
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  <!-- {#snippet action(item: any)}
    <HotkeyButton
      aria-label="history"
      disabled={loading}
      onclick={() =>
        goto(base + `/entities/${collectionname}/history/${item._id}`)}
      size="tableicon"
      variant="icon"
    >
      <History />
    </HotkeyButton>
    <HotkeyButton
      aria-label="edit"
      disabled={loading}
      onclick={() => single_item_click(item)}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
    </HotkeyButton>
  {/snippet} -->
</Entities>

<CustomSuperDebug {formData} />
