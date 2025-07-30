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
  import { Check, Copy, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import Customswitch from "$lib/customswitch/customswitch.svelte";

  let loading = $state(false);

  const { data } = $props();
  let tokens = $state(data.tokens);
  let showcreatetoken = $state(false);
  let showRevokeWarning = $state(false);
  let revoketokenid = $state("");
  let newtokendata = $state({ name: "", exp: "", oneyearvalid: false });
  let newaccesstoken = $state<any>("");
  let shownewaccesstoken = $state(false);
  let disablecloseaccesstokenbutton = $state(true);

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
          if (form.data.newpassword === "") {
            // @ts-ignore
            delete form.data.newpassword;
          }
          await auth.client.UpdateOne({
            collectionname: "users",
            item: { ...form.data },
            jwt: auth.access_token,
          });
          toast.success("User updated");
          goto(base + `/user`);
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

  async function handleCreateToken() {
    // newtokendata.exp has this format in it 2025-07-17 i want to convert it to a string with days from now till that date like 1d, 2d, 3d, etc.
    if (newtokendata.name === "") {
      toast.error("Error", {
        description: "Name is required",
      });
      return;
    }
    if (newtokendata.exp === "" && !newtokendata.oneyearvalid) {
      toast.error("Error", {
        description: "Expiration date is required",
      });
      return;
    }
    let expString = "";
    if (newtokendata.oneyearvalid) {
      expString = "365d";
    } else {
      const expDate = new Date(newtokendata.exp);
      const today = new Date();
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        toast.error("Error", {
          description: "Expiration date must be in the future",
        });
        return;
      }
      expString = diffDays + "d"; // convert to string like 1d, 2d, etc.
    }
    try {
      loading = true;
      // get the token from the response
      const newtoken: any = await auth.client.CustomCommand({
        command: "issueusertoken",
        // @ts-ignore
        data: {
          name: newtokendata.name,
          // exp: "1d",
          exp: expString,
        },
        jwt: auth.access_token,
      });
      newaccesstoken = JSON.parse(newtoken).access_token;

      // need this to update the tokens array becasue we are not getting the entire token object back
      tokens = await auth.client.Query<any>({
        collectionname: "usertokens",
        query: { _type: "usertoken", revoked: false },
        jwt: auth.access_token,
      });

      showcreatetoken = false;
      shownewaccesstoken = true;
      disablecloseaccesstokenbutton = true;

      setTimeout(() => {
        disablecloseaccesstokenbutton = false;
      }, 5000);
      newtokendata = { name: "", exp: "", oneyearvalid: false };
      toast.success("Token created");
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  async function revoketoken() {
    try {
      loading = true;
      await auth.client.CustomCommand({
        command: "revokeusertoken",
        id: revoketokenid,
        jwt: auth.access_token,
      });
      // remove the token from the tokens array
      // @ts-ignore
      tokens = tokens.filter((token: any) => token._id !== revoketokenid);
      toast.success("Access token revoked");
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}

{#if $formData != null}
  <form method="POST" use:enhance>
    <Acl bind:value={$formData} />

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

    <Form.Field {form} name="username" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Username</Form.Label>
          <CustomInput
            placeholder="Type username"
            disabled={loading}
            {...props}
            bind:value={$formData.username}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="newpassword" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Password</Form.Label>
          <CustomInput
            type="password"
            placeholder="Type new password"
            disabled={loading}
            {...props}
            bind:value={$formData.newpassword}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="email" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Email</Form.Label>
          <CustomInput
            placeholder="Type email"
            disabled={loading}
            {...props}
            bind:value={$formData.email}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field
      {form}
      name="disabled"
      class="flex flex-row items-start space-x-3 space-y-0 mb-10 "
    >
      <Form.Control>
        {#snippet children({ props })}
          <CustomCheckbox
            disabled={loading}
            {...props}
            bind:checked={$formData.disabled}
          />
          <div class="space-y-1 leading-none">
            <Form.Label>Disabled</Form.Label>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field
      {form}
      name="dblocked"
      class="flex flex-row items-start space-x-3 space-y-0 mb-10"
    >
      <Form.Control>
        {#snippet children({ props })}
          <CustomCheckbox
            disabled={loading}
            {...props}
            bind:checked={$formData.dblocked}
          />
          <div class="space-y-1 leading-none">
            <Form.Label>DB locked</Form.Label>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field
      {form}
      name="validated"
      class="flex flex-row items-start space-x-3 space-y-0 mb-10"
    >
      <Form.Control>
        {#snippet children({ props })}
          <CustomCheckbox
            disabled={loading}
            {...props}
            bind:checked={$formData.validated}
          />
          <div class="space-y-1 leading-none">
            <Form.Label>Validated</Form.Label>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field
      {form}
      name="emailvalidated"
      class="flex flex-row items-start space-x-3 space-y-0 mb-10"
    >
      <Form.Control>
        {#snippet children({ props })}
          <CustomCheckbox
            disabled={loading}
            {...props}
            bind:checked={$formData.emailvalidated}
          />
          <div class="space-y-1 leading-none">
            <Form.Label>Email Validated</Form.Label>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field
      {form}
      name="formvalidated"
      class="flex flex-row items-start space-x-3 space-y-0 mb-10"
    >
      <Form.Control>
        {#snippet children({ props })}
          <CustomCheckbox
            disabled={loading}
            {...props}
            bind:checked={$formData.formvalidated}
          />
          <div class="space-y-1 leading-none">
            <Form.Label>Form Validated</Form.Label>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    {#if $formData.federationids}
      <div class="mb-10">
        {#each $formData.federationids as item, index}
          <div class="flex items-center justify-start">
            {index + 1}.
            {item.id}
            {item.issuer}
            <HotkeyButton
              class="ml-2 dark:bg-darkbgred"
              aria-label="Delete"
              size="icon"
              disabled={loading}
              variant="icon"
              onclick={() => {
                let arr = $formData.federationids;
                if (arr) {
                  arr.splice(index, 1);
                }
                $formData.federationids = arr;
              }}><Trash2 /></HotkeyButton
            >
          </div>
        {/each}
      </div>
    {/if}

    <div class="my-10">
      <h3 class="text-lg font-semibold mb-2">Access Tokens</h3>
      <div>
        <HotkeyButton
          onclick={() => {
            showcreatetoken = true;
          }}
          disabled={loading}
          aria-label="Update User"
          variant="success"
          size="base"
          data-shortcut="ctrl+s"
        >
          <Plus /> Create new token</HotkeyButton
        >
        {#if tokens && tokens.length > 0}
          {#each tokens as token, index}
            <div class="flex items-center justify-start my-4">
              {index + 1}.
              <span class="text-sm">{token.name}</span>
              <HotkeyButton
                class="ml-2 dark:bg-darkbgred"
                aria-label="Delete"
                size="icon"
                disabled={loading}
                variant="icon"
                onclick={() => {
                  showRevokeWarning = true;
                  revoketokenid = token._id;
                }}><Trash2 /></HotkeyButton
              >
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <HotkeyButton
      type="submit"
      disabled={loading}
      aria-label="Update User"
      variant="success"
      size="base"
      data-shortcut="ctrl+s"
    >
      <Check />
      Update User</HotkeyButton
    >
  </form>
{:else}
  <div>User not found or access denied</div>
{/if}

<CustomSuperDebug {formData} />

<AlertDialog.Root bind:open={showcreatetoken}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Create Access Token</AlertDialog.Title>
      <AlertDialog.Description>
        Create a new token for your user.
      </AlertDialog.Description>
      <div class="py-4">
        <div class="font-medium mb-4">Name</div>
        <CustomInput
          width="w-1/2"
          placeholder="Type name"
          disabled={loading}
          bind:value={newtokendata.name}
        />
      </div>
      <!-- need to add date picker here -->
      <div class="py-4">
        <div class="font-medium mb-4">Expiration Date</div>
        <CustomInput
          min={new Date().toISOString().slice(0, 10)}
          type="date"
          placeholder="Expiration date"
          disabled={newtokendata.oneyearvalid || loading}
          bind:value={newtokendata.exp}
        />
        <div class="flex items-center space-x-2 my-6">
          <Customswitch {loading} bind:checked={newtokendata.oneyearvalid} />
          <div class="font-medium">One year validity</div>
        </div>
      </div>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        variant="danger"
        disabled={loading}
        onclick={() => {
          showcreatetoken = false;
          loading = false;
          newtokendata = { name: "", exp: "", oneyearvalid: false };
        }}>Cancel</HotkeyButton
      >
      <HotkeyButton
        onclick={handleCreateToken}
        type="submit"
        disabled={loading}
        aria-label="Create"
        variant="success"
        size="base"
        data-shortcut="ctrl+s"
      >
        <Check />
        Create
      </HotkeyButton>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={shownewaccesstoken}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Newly Generated Access Token</AlertDialog.Title>
      <AlertDialog.Description>
        This is the new access token for your user. Please copy it and save it
        securely, as it will not be shown again.
      </AlertDialog.Description>
      <AlertDialog.Description>
        You may close this dialog after 5 seconds.
      </AlertDialog.Description>

      <div class="py-6">
        <div class="font-medium mb-4">Access Token</div>
        <div class="flex items-center space-x-2">
          <CustomInput
            width="w-full"
            placeholder="Access Token"
            disabled={true}
            bind:value={newaccesstoken}
          />
          <!-- copy button -->
          <HotkeyButton
            onclick={() => {
              navigator.clipboard.writeText(newaccesstoken);
              toast.success("Access token copied to clipboard");
            }}
            disabled={loading}
            aria-label="Copy Access Token"
            variant="icon"
            size="icon"
          >
            <Copy />
          </HotkeyButton>
        </div>
      </div>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <!-- here i wnat a timout to trigger after 5 seconds to enable the close button -->
      <!-- add timer -->
      <HotkeyButton
        title="Close"
        variant="danger"
        disabled={disablecloseaccesstokenbutton}
        onclick={() => {
          navigator.clipboard.writeText(newaccesstoken);
          toast.success("Access token copied to clipboard");
          shownewaccesstoken = false;
          loading = false;
          newaccesstoken = null;
          disablecloseaccesstokenbutton = true;
        }}>Close and copy</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<Warningdialogue
  bind:showWarning={showRevokeWarning}
  type="usertoken"
  onaccept={revoketoken}
  oncancel={() => (showRevokeWarning = false)}
></Warningdialogue>
