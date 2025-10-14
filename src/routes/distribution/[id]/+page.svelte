<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

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
        try {
          form.data.kernel = data.item.kernel;

          if(form.data.vcpu == 0 ){
            // @ts-ignore
            delete form.data.vcpu;
          }

          if(form.data.mem == 0 ){
            // @ts-ignore
            delete form.data.mem;
          }

          await auth.client.CustomCommand({
            command: "ensuresfdistro",
            // @ts-ignore
            data: form.data,
            jwt: auth.access_token,
          });

          toast.success("Distribution updated");
          goto(base + `/distribution`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        let errors = Object.keys(form.errors).map(
          (key) => key + " is " + form.errors[key],
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
          <Form.Label>Min Instances</Form.Label>
          <CustomInput
            type="number"
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
          <Form.Label>Max Instances</Form.Label>
          <CustomInput
            type="number"
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
          <Form.Label>Min Warm Instances</Form.Label>
          <CustomInput
            type="number"
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
          <Form.Label>Max Warm Instances</Form.Label>
          <CustomInput
            type="number"
            disabled={loading}
            {...props}
            bind:value={$formData.max_warm_instances}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="vcpu" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>VCPU</Form.Label>
          <CustomInput
            type="number"
            disabled={loading}
            {...props}
            bind:value={$formData.vcpu}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="mem" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Memory</Form.Label>
          <CustomInput
            type="number"
            disabled={loading}
            {...props}
            bind:value={$formData.mem}
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
              description="If enabled, the function will always pre download."
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
