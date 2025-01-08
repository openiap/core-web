<script lang="ts" module>
  // export let collectionname = "entities";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { toast } from "svelte-sonner";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import { ObjectInput } from "$lib/objectinput/index.js";

  let loading = $state(false);
  let errormessage = $state("");
  let showdebug = $state(false);
  const { data } = $props();
  const collection = data.collection;
  const id = data.id;
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      loading = true;
      if (form.valid) {
        console.log("test");
        try {
          await auth.client.UpdateOne({
            collectionname: collection,
            item: { ...form.data, _id: id },
            jwt: auth.access_token,
          });
          toast.success(collection + " updated");
          goto(base + `/entities`);
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
        console.log("test");
        errormessage = "Form is invalid";
      }
    },
  });

  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.data.form.data);
  validateForm({ update: true });
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

<div>
  Edit {collection}
</div>

<form method="POST" use:enhance>
  <Form.Button disabled={loading} aria-label="submit">Save</Form.Button>

  <Acl bind:value={$formData} />

  <ObjectInput classname="h-screen" bind:value={$formData} />
</form>

{#if formData != null && showdebug == true}
  <div class="mt-4">
    <SuperDebug data={formData} theme="vscode" />
  </div>
{/if}

<HotkeyButton
  hidden
  class="hidden"
  aria-label="Toggle debug"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
