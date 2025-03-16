<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newMemberSchema } from "../../schema.js";

  const { data } = $props();
  $effect(() => {
    if (
      data.id != usersettings.currentworkspace &&
      usersettings.currentworkspace != ""
    ) {
      goto(base + "/workspace/" + usersettings.currentworkspace + "/invite");
    } else if (usersettings.currentworkspace == "") {
      goto(base + "/workspace");
    }
  });

  let loading = $state(false);
  let errormessage = $state("");
  const form = superForm(defaults(zod(newMemberSchema)), {
    dataType: "json",
    validators: zod(newMemberSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        try {
          form.data.workspaceid = data.id;
          await auth.client.CustomCommand({
            command: "inviteuser",
            data: JSON.stringify(form.data),
            jwt: auth.access_token,
          });
          toast.success("User invited successfully");
          goto(base + `/workspace/${data.id}/member`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        }
      } else {
        errormessage = "Form is not valid" + form.errors;
        let errors = Object.keys(form.errors).map((key) => key + " is " + (form.errors as any)[key]);
        if(errors.length > 0) {
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

<div class="mx-4 my-1">
  {#if errormessage && errormessage != ""}
    {errormessage}
  {/if}

  {#if message && $message != ""}
    {$message}
  {/if}
  <form method="POST" use:enhance>
    <Form.Field {form} name="email" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Email</Form.Label>
          <Form.Description
          class="text-bw500"
            >The email of the user you want to invite</Form.Description
          >
          <CustomInput {...props} bind:value={$formData.email} autofocus />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <HotkeyButton
      type="submit"
      data-shortcut="ctrl+s"
      disabled={loading}
      aria-label="Create Invitation"
      variant="success"
      size="base"
    >
      <Check />
      Create Invitation</HotkeyButton
    >
  </form>

  <CustomSuperDebug {formData} />
</div>
