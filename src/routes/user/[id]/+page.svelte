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
  import {
    Check,
    Clapperboard,
    Copy,
    IdCard,
    Plus,
    Timer,
    Trash2,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import Customswitch from "$lib/customswitch/customswitch.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";

  const { data } = $props();

  if (data.item != null) {
    data.item = editFormSchema.parse(data.item);
  }

  let loading = $state(false);
  let tokens = $state(data.tokens);
  let showcreatetoken = $state(false);
  let showRevokeWarning = $state(false);
  let revoketokenid = $state("");
  // here exp should be dynamically 1 year in the future
  let oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  let newtokendata = $state({
    name: "",
    exp: oneYearFromNow.toISOString().slice(0, 10),
    neverexpire: false,
  });
  let newaccesstoken = $state<any>("");
  let shownewaccesstoken = $state(false);
  let disablecloseaccesstokenbutton = $state(true);

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
    if (newtokendata.exp === "" && !newtokendata.neverexpire) {
      toast.error("Error", {
        description: "Expiration date is required",
      });
      return;
    }
    let expString = "";
    if (newtokendata.neverexpire) {
      expString = "36135d";
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
          workspaceid: usersettings.currentworkspace,
          exp: expString,
          id: data.item._id,
        },
        jwt: auth.access_token,
      });
      newaccesstoken = JSON.parse(newtoken).access_token;

      // need this to update the tokens array because we are not getting the entire token object back
      tokens = await auth.client.Query<any>({
        collectionname: "usertokens",
        query: { _type: "usertoken", revoked: false, _userid: data.item._id },
        jwt: auth.access_token,
      });

      showcreatetoken = false;
      shownewaccesstoken = true;
      disablecloseaccesstokenbutton = true;

      setTimeout(() => {
        disablecloseaccesstokenbutton = false;
      }, 5000);
      newtokendata = {
        name: "",
        exp: oneYearFromNow.toISOString().slice(0, 10),
        neverexpire: false,
      };
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
  function RenderExpiry(item: any) {
    const expDate = new Date(item);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();

    // If expiration is more than 50 years in the future, treat as never expires
    const fiftyYearsMs = 50 * 365 * 24 * 60 * 60 * 1000;
    if (diffMs > fiftyYearsMs) {
      return "Never expires";
    }

    if (diffMs <= 0) {
      return "Expired";
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} left`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} left`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} left`;
    } else {
      return "Less than 1 minute";
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

    <h3 class="mb-2">Federation Ids</h3>
    {#if $formData.federationids?.length > 0}
      <div class="mb-10">
        {#each $formData.federationids as item, index}
          <div class="flex items-center justify-start">
            {index + 1}.
            {#if typeof item === "object"}
              {item.id}
              {item.issuer}
            {:else}
              {item}
            {/if}
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
    {:else}
      <div class="text-sm text-bw500">No federation IDs found</div>
    {/if}

    <div class="my-10">
      <div class="flex items-center justify-between">
        <h3 class="text-lg mb-2">Access Tokens</h3>
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
      </div>
      <div>
        {#if tokens && tokens.length > 0}
          <div class="mt-4 overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-100 dark:bg-bw900">
                  <th class="border border-bw500 px-4 py-2 text-left">#</th>
                  <th class="border border-bw500 px-4 py-2 text-left">
                    <div class=" flex items-center">
                      <IdCard
                        class="h-4 w-4 me-1.5 text-bw600 dark:text-bw500"
                      />
                      Name
                    </div>
                  </th>
                  <th class="border border-bw500 px-4 py-2 text-left">
                    <div class=" flex items-center">
                      <Timer
                        class="h-4 w-4 me-1.5 text-bw600 dark:text-bw500"
                      />
                      Expiry
                    </div>
                  </th>
                  {#if auth.config.workspace_enabled}
                    <th class="border border-bw500 px-4 py-2 text-left">
                      <div class=" flex items-center">
                        <IdCard
                          class="h-4 w-4 me-1.5 text-bw600 dark:text-bw500"
                        />
                        Workspace
                      </div>
                    </th>
                  {/if}
                  <th class="border border-bw500 px-4 py-2 text-left">
                    <div class=" flex items-center">
                      <Clapperboard
                        class="h-4 w-4 me-1.5 text-bw600 dark:text-bw500"
                      />
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each tokens as token, index}
                  <tr class="text-nowrap">
                    <td class="border border-bw500 px-4 py-2">{index + 1}</td>
                    <td class="border border-bw500 px-4 py-2 text-sm"
                      >{token.name}</td
                    >
                    <td class="border border-bw500 px-4 py-2 text-sm">
                      {RenderExpiry(token.exp)}
                    </td>
                    {#if auth.config.workspace_enabled}
                      <td class="border border-bw500 px-4 py-2 text-sm">
                        {token._workspacename || "-"}
                      </td>
                    {/if}
                    <td class="border border-bw500 px-4 py-2">
                      <HotkeyButton
                        aria-label="Delete"
                        variant="danger"
                        size="icon"
                        disabled={loading}
                        onclick={() => {
                          showRevokeWarning = true;
                          revoketokenid = token._id;
                        }}><Trash2 /></HotkeyButton
                      >
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-sm text-bw500">No access tokens found</div>
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
          disabled={newtokendata.neverexpire || loading}
          bind:value={newtokendata.exp}
        />
        <div class="flex items-center space-x-2 my-6">
          <Customswitch {loading} bind:checked={newtokendata.neverexpire} />
          <div class="font-medium">Never expire</div>
        </div>
      </div>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        title="Cancel"
        variant="danger"
        disabled={loading}
        onclick={() => {
          showcreatetoken = false;
          loading = false;
          newtokendata = {
            name: "",
            exp: oneYearFromNow.toISOString().slice(0, 10),
            neverexpire: false,
          };
        }}>Cancel</HotkeyButton
      >
      <HotkeyButton
        onclick={handleCreateToken}
        type="submit"
        disabled={loading}
        aria-label="Create"
        variant="success"
        size="base"
        data-shortcut="enter"
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
