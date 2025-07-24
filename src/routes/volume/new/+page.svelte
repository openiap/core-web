<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

  let loading = $state(false);

  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
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
          form.data.provider = "image"
          const res = await auth.client.CustomCommand({
            command: "ensuresfvolume",
            // @ts-ignore
            data: form.data,
            jwt: auth.access_token
          });

          toast.success("Volume created");
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

  <Form.Field {form} name="provider" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Provider</Form.Label>
        <CustomInput
          placeholder="Type provider"
          disabled={true}
          {...props}
          bind:value={$formData.provider}
        />
        <!-- <CustomSelect
          triggerContent={() => {
            return $formData.provider ? $formData.provider : "Select Provider";
          }}
          type="single"
          selectitems={["image", "minio", "radosgw", "ceph-rbd"]}
          {loading}
          {...props}
          bind:value={$formData.provider}
        /> -->
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
          disabled={loading}
          {...props}
          bind:value={$formData.size_mb}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <HotkeyButton
    type="submit"
    disabled={loading}
    aria-label="Create Volume"
    variant="success"
    size="base"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create Volume
  </HotkeyButton>
</form>

<CustomSuperDebug {formData} />
