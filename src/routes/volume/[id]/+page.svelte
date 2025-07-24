<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import { usersettings } from "$lib/stores/usersettings.svelte";

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
          const workspaceid = usersettings.currentworkspace;
          if (workspaceid == "" || workspaceid == null) {
            toast.error("Error", {
              description: "Please select a workspace",
            });
            cancel();
            loading = false;
            return;
          }
          form.data._workspaceid = workspaceid;

          await auth.client.CustomCommand({
            command: "ensuresfvolume",
            // @ts-ignore
            data: form.data,
            jwt: auth.access_token,
          });

          toast.success("Volume updated");
          goto(base + `/volume`);
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
            disabled={true}
            {...props}
            bind:value={$formData.name}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="path" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Path</Form.Label>
          <CustomInput
            placeholder="Type path"
            disabled={loading}
            {...props}
            bind:value={$formData.path}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="provider" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Provider</Form.Label>
          <CustomSelect
            triggerContent={() => {
              return $formData.provider
                ? $formData.provider
                : "Select Provider";
            }}
            type="single"
            selectitems={["image", "minio", "radosgw", "ceph-rbd"]}
            loading={true}
            {...props}
            bind:value={$formData.provider}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="state" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>State</Form.Label>
          <CustomSelect
            triggerContent={() => {
              return $formData.state ? $formData.state : "Select State";
            }}
            type="single"
            selectitems={["unprovisioned", "provisioned", "dirty"]}
            loading={true}
            {...props}
            bind:value={$formData.state}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="size_mb" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Size (MB)</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type size in MB"
            disabled={true}
            {...props}
            bind:value={$formData.size_mb}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="access_key" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Access Key</Form.Label>
          <CustomInput
            width="w-full"
            placeholder="Type access key"
            disabled={true}
            {...props}
            bind:value={$formData.access_key}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="secret_key" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Secret Key</Form.Label>
          <CustomInput
            width="w-full"
            placeholder="Type secret key"
            disabled={true}
            {...props}
            bind:value={$formData.secret_key}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <HotkeyButton
      type="submit"
      disabled={loading}
      aria-label="Update Volume"
      variant="success"
      size="base"
      data-shortcut="ctrl+s"
    >
      <Check />
      Update Volume
    </HotkeyButton>
  </form>
{:else}
  <div>Volume not found or access denied</div>
{/if}

<CustomSuperDebug {formData} />
