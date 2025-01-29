<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../../schema.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";

  const key = "workitem";
  let loading = $state(false);
  let errormessage = $state("");
  let newid = $state("");
  let members: any = $state([]);

  const { data } = $props();
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          if( form.data.nextruns){
            // @ts-ignore
            form.data.nextrun = new Date(form.data.nextrun);
          }
          if( form.data.lastrun){
            // @ts-ignore
            form.data.lastrun = new Date(form.data.lastrun);
          }

          await auth.client.UpdateWorkitem({
            jwt: auth.access_token,
            // @ts-ignore
            workitem: form.data,
          });
          toast.success("Workitem updated");
          goto(base + `/${key}`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        } finally {
        }
      } else {
        errormessage = "Form is invalid";
      }
    },
  });

  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Form.Field {form} name="name" class="mb-7">
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

  <Form.Field {form} name="queue" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>State</Form.Label>
        <CustomSelect
          type="single"
          {loading}
          {...props}
          triggerContent={() => {
            if ($formData.state === "new") {
              return "New";
            } else if ($formData.state === "running") {
              return "Running";
            } else if ($formData.state === "completed") {
              return "Completed";
            } else if ($formData.state === "failed") {
              return "Failed";
            }
          }}
          bind:value={$formData.state}
          selectitems={[
            { value: "new", label: "New" },
            { value: "running", label: "Running" },
            { value: "completed", label: "Completed" },
            { value: "failed", label: "Failed" },
          ]}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="queue" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Queue</Form.Label>
        <EntitySelector
          collectionname="mq"
          bind:value={$formData.wiqid}
          basefilter={{ _type: "workitemqueue" }}
          class="w-64"
          name="queue"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="payload" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Payload</Form.Label>
        <ObjectInput
          bind:value={$formData.payload}
          basefilter={{ _type: "workitemqueue" }}
          class="w-64 m-h-full"
          name="queue"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="retries" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Retries</Form.Label>
        <CustomInput
          placeholder="Type name"
          disabled={loading}
          {...props}
          bind:value={$formData.retries}
          type="number"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="priority" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Priority</Form.Label>
        <CustomInput
          placeholder="Type name"
          disabled={loading}
          {...props}
          bind:value={$formData.priority}
          type="number"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Update"
  >
    <Check />
    Update {key}</Form.Button
  >
</form>

<CustomSuperDebug {formData} />
