<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { CollectionSelector } from "$lib/collectionselector/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomCheckbox } from "$lib/customcheckbox";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";
  import Acl from "$lib/acl/acl.svelte";

  let loading = $state(false);

  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.InsertOne({
            collectionname: "config",
            item: { ...form.data },
            jwt: auth.access_token,
          });
          toast.success("Entity restriction added");
          goto(base + `/entityrestriction`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        let errors = Object.keys(form.errors).map(
          (key) => key + " is " + (form.errors as any)[key],
        );
        if (errors.length > 0) {
          toast.error("Error", {
            description: errors.join(", "),
          });
        } else {
          toast.error("Error", {
            description: "Form is invalid",
          });
        }
        cancel();
        loading = false;
      }
    },
  });
  const { form: formData, enhance, message } = form;
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Acl bind:value={$formData} />

  <Form.Field {form} name="name" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <CustomInput
          placeholder="Type name"
          disabled={loading}
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="collection" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Collection</Form.Label>
        <CollectionSelector {...props} bind:value={$formData.collection} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="copyperm"
    class="flex flex-row items-start space-x-3 space-y-0 mb-10"
  >
    <Form.Control>
      {#snippet children({ props })}
        <CustomCheckbox
          disabled={loading}
          {...props}
          bind:checked={$formData.copyperm}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>Copy Permission</Form.Label>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.paths}
    {#each $formData.paths as item, index}
      <Form.Field {form} name="paths">
        <Form.Control>
          {#snippet children({ props })}
            {#if $formData.paths}
              <div class="flex items-center justify-start">
                <CustomInput
                  placeholder="Federation email"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.paths[index]}
                />
                <HotkeyButton
                  class="ml-2 dark:bg-darkbgred"
                  aria-label="delete"
                  size="base"
                  disabled={loading}
                  variant="icon"
                  onclick={() => {
                    let arr = $formData.paths;
                    if (arr) {
                      arr.splice(index, 1);
                    }
                    $formData.paths = arr;
                  }}><Trash2 /></HotkeyButton
                >
              </div>
            {/if}
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    {/each}
  {/if}
  <div>
    <HotkeyButton
      class="mb-7"
      aria-label="add federation id"
      disabled={loading}
      variant="base"
      size="base"
      onclick={() => {
        let arr = $formData.paths || [];
        $formData.paths = [...arr, "$.[?(@ && @._type == 'test')]"];
      }}
    >
      <Plus />
      Add Path</HotkeyButton
    >
  </div>

  <HotkeyButton
    type="submit"
    disabled={loading}
    aria-label="Update Entity Restriction"
    variant="success"
    size="base"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create Entity Restriction</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
