<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

  let loading = $state(false);
  let errormessage = $state("");
  const { data } = $props();
  const collection = data.collection;
  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      loading = true;
      if (form.valid) {
        try {
          await auth.client.InsertOne({
            collectionname: collection,
            item: form.data,
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
  <Form.Button
    data-shortcut="ctrl+s"
    class="mb-4"
    disabled={loading}
    aria-label="Save Changes"
    variant="success"
    size="base"
  >
    <Check />
    Save Changes</Form.Button
  >

  <Acl bind:value={$formData} />

  <ObjectInput classname="min-h-[74vh]" bind:value={$formData} />
</form>

<CustomSuperDebug {formData} />
