<script lang="ts">
  import { browser } from "$app/environment";
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
  import { Check, Download } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../../schema.js";

  const { data } = $props();
  let loading = $state(false);
  let files: Array<File> = $state([]);
  let filedata: Array<{ filename: string; _id: string }> = $state([]);
  let imagesSize = $state(data.itemSize || []);

  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          if (form.data.nextrun) {
            // @ts-ignore
            form.data.nextrun = new Date(form.data.nextrun);
          }
          if (form.data.lastrun) {
            // @ts-ignore
            form.data.lastrun = new Date(form.data.lastrun);
          }
          await uploadFiles();
          if (filedata.length > 0) {
            form.data.files = form.data.files.concat(filedata);
          }
          await auth.client.UpdateWorkitem({
            jwt: auth.access_token,
            // @ts-ignore
            workitem: form.data,
          });
          toast.success("Workitem updated");
          goto(base + `/workitem/${form.data.wiqid}`);
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
  function uploadFiles() {
    return new Promise<void>((resolve, reject) => {
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const reader = new FileReader();
          const file = files[i];
          reader.onload = async (e) => {
            try {
              const content = new Uint8Array(reader.result as ArrayBuffer);
              const name = file.name;
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

  async function downloadFile(item: any) {
    try {
      var filecontent: any = await auth.client.DownloadFile({
        id: item._id,
        jwt: auth.access_token,
      });
      var blob = new Blob([filecontent], { type: item.contentType });
      var link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = item.name || item.metadata.name;
      link.click();
    } catch (error: any) {
      toast.error("Error while downloading", {
        description: error.message,
      });
    }
  }

  async function viewImage(fileId: string): Promise<void> {
    if (!fileId) return;
    try {
      const filecontent: any = await auth.client.DownloadFile({
        id: fileId,
        jwt: auth.access_token,
      });
      if (!filecontent) return;
      const blob = new Blob([filecontent], { type: filecontent.contentType });
      const image_url = URL.createObjectURL(blob);
      const element = document.getElementById(fileId);
      if (element == null) return;
      element.setAttribute("src", image_url);
      element.classList.remove("hidden");
    } catch (error: any) {
      if (browser) {
        toast.error("Error loading image", {
          description: error.message,
        });
      }
    }
  }
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

  <Form.Field {form} name="wiqid" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Queue</Form.Label>
        <EntitySelector
          queryas={usersettings.currentworkspace}
          collectionname="mq"
          bind:value={$formData.wiqid}
          basefilter={{ _type: "workitemqueue" }}
          class="w-64"
          name="queue"
          propertyname="_id"
          >{#snippet rendername(item: any)}
            {item.name}
          {/snippet}
          {#snippet rendercontent(item: any)}
            {#if item == null}
              Select a queue
            {:else}
              {item.name}
            {/if}
          {/snippet}</EntitySelector
        >
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="payload" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Payload</Form.Label>
        <ObjectInput
          bind:value={$formData.payload}
          basefilter={{ _type: "workitemqueue" }}
          class="h-36"
          name="queue"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <div class="flex space-x-5 font-medium text-sm">
    <div class="mb-10">
      <div class="mb-2">State</div>
      <div class="text-bw400">
        {$formData.state}
      </div>
    </div>
    <div class="mb-10">
      <div class="mb-2">Retries</div>
      <div class="text-bw400">
        {$formData.retries}
      </div>
    </div>
    <div class="mb-10">
      <div class="mb-2">Priority</div>
      <div class="text-bw400">
        {$formData.priority}
      </div>
    </div>
  </div>

  {#if $formData.files.length > 0}
    <div class="mb-2">Current files:</div>
    {#each $formData.files as file, index}
      <div class="mb-2">
        <div class="flex space-x-2 mb-2">
          <div>
            {`${index + 1}. ${file.filename}`}
          </div>
          <HotkeyButton
            onclick={() => downloadFile(file)}
            aria-label="Download"
            size="tableicon"
            variant="icon"><Download /></HotkeyButton
          >
        </div>
        {#if file.filename.match(/\.(jpeg|jpg|gif|png)$/)}
          {#await viewImage(file._id)}
            <span class="hidden"></span>
          {/await}
          <!-- svelte-ignore a11y_invalid_attribute -->
          <a
            href=""
            onclick={() => {
              imagesSize[index] = !imagesSize[index];
              if (imagesSize[index]) {
                const element = document.getElementById(file._id);
                if (element === null) return;
                element.classList.remove("w-16");
                element.classList.remove("h-16");
              } else {
                const element = document.getElementById(file._id);
                if (element === null) return;
                element.classList.add("w-16");
                element.classList.add("h-16");
              }
            }}
          >
            <img
              id={file._id}
              alt={file.filename}
              class={"object-cover hidden w-16 h-16"}
            />
          </a>
        {/if}
      </div>
    {/each}
  {/if}

  <div class="mb-10">
    <div class="mb-2 font-medium text-sm">Upload Files</div>
    <CustomInput
      height="h-full"
      placeholder="Type name"
      disabled={loading}
      type="file"
      multiple={true}
      onchangefunction={(e: any) => {
        const copyFiles = e.target.files;
        const existingFileNames = $formData.files.map(
          (file: any) => file.filename,
        );

        let tempFiles: Array<File> = [];

        for (let i = 0; i < copyFiles.length; i++) {
          if (existingFileNames.includes(copyFiles[i].name)) {
            toast.error("Error", {
              description: `File with name ${copyFiles[i].name} already exists.`,
            });
          } else {
            tempFiles = [...tempFiles, copyFiles[i]];
          }
        }
        files = tempFiles;
      }}
    />
  </div>

  {#if files.length > 0}
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
  {/if}

  <HotkeyButton
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Update Work Item"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Update Work Item</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
