<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";

  let loading = $state(false);

  const { data } = $props();

  if (data.item != null) {
    data.item = editFormSchema.parse(data.item);
  }

  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        // @ts-ignore
        form.repo = form.name;
        cancel();
        loading = false;
      }
    },
  });
  const { form: formData, enhance, message, validateForm } = form;
  try {
    formData.set(data.item);
    validateForm({ update: true });
  } catch (error: any) {
    toast.error("Error while enhancing", {
      description: error.message,
    });
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}

{#if $formData != null}
  <form method="POST" use:enhance>
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

     <Form.Field {form} name="kernel" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Kernel</Form.Label>
          <CustomInput
            placeholder="Type kernel"
            disabled={true}
            {...props}
            bind:value={$formData.kernel}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="min_instances" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>min_instances</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type min_instances"
            disabled={loading}
            {...props}
            bind:value={$formData.min_instances}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="max_instances" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>max_instances</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type max_instances"
            disabled={loading}
            {...props}
            bind:value={$formData.max_instances}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="min_warm_instances" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>min_warm_instances</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type min_warm_instances"
            disabled={loading}
            {...props}
            bind:value={$formData.min_warm_instances}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="max_warm_instances" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>max_warm_instances</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type max_warm_instances"
            disabled={loading}
            {...props}
            bind:value={$formData.max_warm_instances}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="tag" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Tag</Form.Label>
          <CustomInput
            placeholder="Type tag"
            disabled={loading}
            {...props}
            bind:value={$formData.tag}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

     <Form.Field {form} name="repo" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Repo</Form.Label>
          <CustomInput
            placeholder="Type repo"
            disabled={true}
            {...props}
            bind:value={$formData.repo}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="predownload" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <div class="flex flex-col space-y-4">
            <Form.Label>Pre Download</Form.Label>
            <CustomSwitch
              label="Pre Download"
              description="If enabled, the function will always parse HTTP requests."
              loading={true}
              {...props}
              bind:checked={$formData.predownload}
            />
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="distro" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Distro</Form.Label>
           <CustomInput
            placeholder="Type repo"
            disabled={true}
            {...props}
            bind:value={$formData.distro}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <HotkeyButton
      type="submit"
      disabled={loading}
      aria-label="Update Distribution"
      variant="success"
      size="base"
      data-shortcut="ctrl+s"
    >
      <Check />
      Update Distribution</HotkeyButton
    >
  </form>
{:else}
  <div>Data not found or access denied</div>
{/if}

<CustomSuperDebug {formData} />
