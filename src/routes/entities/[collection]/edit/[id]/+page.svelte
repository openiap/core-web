<script lang="ts" module>
  // export let collectionname = "entities";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../../schema.js";

  let loading = $state(false);
  let errormessage = $state("");
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

<form method="POST" use:enhance>
  <HotkeyButton
    class="mb-4"
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Save Changes"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Save Changes</HotkeyButton
  >

  <Acl bind:value={$formData} />

  <ObjectInput height="min-h-[70vh]" bind:value={$formData} />
</form>

<CustomSuperDebug {formData} />
