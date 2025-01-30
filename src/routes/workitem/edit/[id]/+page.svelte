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
  import { Check, Download } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../../schema.js";

  const key = "workitem";
  let loading = $state(false);
  let errormessage = $state("");
  let files = $state([]);
  let filedata: Array<{ filename: string; _id: string }> = $state([]);

  const { data } = $props();
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

  // async function viewImage1(id: string) {
  //   var item: object = await auth.client.FindOne({
  //     collectionname: "fs.files",
  //     query: { _id: id },
  //     jwt: auth.access_token,
  //   });
  //   console.log(item);
  //   if (item) {
  //     if (item?.filename && item?.metadata?.name) {
  //       var filecontent: any = await auth.client.DownloadFile({
  //         // @ts-ignore
  //         id: item._id,
  //         jwt: auth.access_token,
  //       });
  //       console.log("filecontent", filecontent);
  //       var blob = new Blob([filecontent], { type: item.contentType });
  //       var link = document.createElement("a");
  //       link.href = window.URL.createObjectURL(blob);
  //       link.download = item.filename || item.metadata.name;
  //       link.click();
  //     }
  //   }
  // }

  // async function viewImage(fileId: string): Promise<string> {
  //   if (!fileId) return "";
  //   // var imageData: any = await auth.client.FindOne({
  //   //   collectionname: "fs.files",
  //   //   query: { _id: fileId },
  //   //   jwt: auth.access_token,
  //   // });
  //   // console.log("imageData", imageData);

  //   try {
  //     const filecontent: any = await auth.client.DownloadFile({
  //       id: fileId,
  //       jwt: auth.access_token,
  //     });

  //     if (!filecontent) return "";

  //     // Create a Blob from the file content
  //     const blob = new Blob([filecontent], { type: "image/png" }); // Adjust MIME type accordingly
  //     const image_url = URL.createObjectURL(blob);
  //     console.log("image_url", image_url);
  //     // Generate an object URL
  //     return image_url;
  //   } catch (error) {
  //     console.error("Error loading image", error);
  //     return "";
  //   }
  //   return "";
  // }

  function b64toBlob(b64Data: string, contentType: string) {
    const byteCharacters = atob(b64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }
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

  <div class="mb-7">
    <div class="mb-2">State</div>
    <div class="text-bw400">
      {$formData.state}
    </div>
  </div>

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

  {#if $formData.files.length > 0}
    <div class="mb-7">
      Current files:
      {#each $formData.files as file, index}
        <div class="flex space-x-2 mb-2">
          <div>
            <!-- {#if file.filename.match(/\.(jpeg|jpg|gif|png)$/) && index === 0}
              <img
                src={viewImage(file._id)}
                alt={file.filename}
                class="w-16 h-16 object-cover"
              />
            {:else} -->
              {`${index + 1}) ${file.filename}`}
            <!-- {/if} -->
          </div>
          <HotkeyButton
            onclick={() => downloadFile(file)}
            title="download"
            aria-label="download"
            size="tableicon"
            variant="icon"><Download /></HotkeyButton
          >
        </div>
      {/each}
    </div>
  {/if}

  <div class="mb-7">
    <div class="mb-2">Upload Files</div>
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

  {#if files.length > 0}
    <div class="mb-7">
      files:
      {#each files as file, index}
        <div class="flex space-x-2 mb-2">
          <div>
            {// @ts-ignore
            file.name}
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
