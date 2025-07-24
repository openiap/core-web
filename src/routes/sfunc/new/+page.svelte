<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";
    import { CustomInput } from "$lib/custominput/index.js";

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
          form.data._workspaceid = workspaceid;

          if (workspaceid == "" || workspaceid == null) {
            toast.error("Error", {
              description: "Please select a workspace",
            });
            cancel();
            loading = false;
            return;
          }
          console.log("Creating SF Function with data:", form.data);
          const res = await auth.client.CustomCommand({
            command: "ensuresfunc",
            // @ts-ignore
            data: form.data,
            jwt: auth.access_token,
          });

          toast.success("Function created");
          goto(base + `/sfunc`);
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

  <HotkeyButton
    type="submit"
    disabled={loading}
    aria-label="Create SF Function"
    variant="success"
    size="base"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create SF Function</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
