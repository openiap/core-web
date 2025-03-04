<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../../schema.js";

  let { data } = $props();
  let loading = $state(false);
  let files = $state([]);
  let filedata: Array<{ filename: string; _id: string }> = $state([]);

  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await uploadFiles();
          await auth.client.PushWorkitem({
            wiqid: form.data.wiqid,
            name: form.data.name,
            payload: form.data.payload,
            priority: form.data.priority,
            files: filedata,
            jwt: auth.access_token,
          });
          toast.success("Workitem added");
          goto(base + `/workitem/${form.data.wiqid}`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        loading = false;
        toast.error("Error", {
          description: "Form is invalid",
        });
      }
    },
  });
  const { form: formData, enhance, message } = form;
  $formData.wiqid = data.id === "new" ? "" : data.id || "";

  function uploadFiles() {
    return new Promise<void>((resolve, reject) => {
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const reader = new FileReader();
          const file = files[i];
          reader.onload = async (e) => {
            try {
              const content = new Uint8Array(reader.result as ArrayBuffer);
              // @ts-ignore
              const name = file.name;
              // @ts-ignore
              const type = file.type;
              const id = await auth.client.UploadFile(
                name,
                type,
                content,
                auth.access_token,
              );
              filedata.push({ _id: id, filename: name });
              if (i === files.length - 1) {
                resolve();
              }
            } catch (error: any) {
              reject(error);
              toast.success("Upload Error", {
                description: error.message,
              });
            }
          };
          reader.readAsArrayBuffer(file);
        }
      } else {
        resolve();
      }
    });
  }
</script>

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

  <Form.Field {form} name="wiqid" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col items-start space-y-2">
          <Form.Label>Queue</Form.Label>
          <EntitySelector
            queryas={usersettings.currentworkspace}
            collectionname="mq"
            bind:value={$formData.wiqid}
            basefilter={{ _type: "workitemqueue" }}
            name="queue"
          />
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="payload" class="mb-4">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Payload</Form.Label>
        <ObjectInput bind:value={$formData.payload} class="h-36" name="queue" />
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

  <div class="mb-7">
    <div class="mb-2">Upload Files</div>
    <div class="flex justify-start space-x-5">
      <CustomInput
        placeholder="Type name"
        disabled={loading}
        type="file"
        multiple={true}
        onchangefunction={(e: any) => {
          files = e.target.files;
        }}
      />
    </div>
  </div>

  {#if files.length > 0}
    <div class="mb-7">
      <div class="mb-2">New files:</div>
      {#each files as file, index}
        <div class="flex space-x-2 mb-2">
          <div>
            {`${index + 1}. 
              ${
                // @ts-ignore
                file.name
              }`}
          </div>
          <HotkeyButton
            size="icon"
            variant="danger"
            disabled={loading}
            onclick={() => {
              let copyarray = [...files];
              copyarray?.splice(index, 1);
              files = copyarray;
            }}
            aria-label="Delete"
          >
            X
          </HotkeyButton>
        </div>
      {/each}
    </div>
  {/if}
  <HotkeyButton
    class="w-full md:w-auto"
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Create Work Item"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create Work Item</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
