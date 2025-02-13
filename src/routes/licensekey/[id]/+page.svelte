<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, KeyRound, Minus, Plus } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { LicenseSchema } from "../schema.js";
  import { client } from "@openiap/jsapi/dist/client.js";
  import { ResourceUsage } from "$lib/types.svelte.js";
  import Textarea from "$lib/components/ui/textarea/textarea.svelte";

  let loading = $state(false);
  let errormessage = $state("");
  let newid = $state("");
  let members: any = $state([]);
  let valueprompt = $state(false);
  let valueprompttitle = $state("");
  let valuepromptdescription = $state("");
  let valuepromptvalue = $state(0);
  let valuepromptaction:
    | "addconnection"
    | "removeconnection"
    | "addworkspace"
    | "removeworkspace"
    | "addgitrepo"
    | "removegitrepo" = $state("addconnection");
  let showlicenseprompt = $state(false);
  let licensekey = $state("");
  const { data } = $props();
  let LicenseVersions = [
    { name: "Version 3", _id: 3 },
    { name: "Version 2", _id: 2 },
  ];
  let products = $state([
    {
      stripeprice: "",
      name: "Free tier",
    },
  ]);
  if (data.resource != null) {
    data.resource.products = data.resource.products.filter(
      (x: any) => x.deprecated != true,
    );
    products = [
      { stripeprice: "", name: "Free tier" },
      ...data.resource.products,
    ];
  }
  const triggerContentPlan = $derived(
    () =>
      products.find((item: any) => item.stripeprice === $formData._stripeprice)
        ?.name ?? "Select a plan",
  );
  const triggerContentVersion = $derived(
    () =>
      LicenseVersions.find((item: any) => item._id === $formData.licenseversion)
        ?.name ?? "Select a version",
  );

  const form = superForm(defaults(zod(LicenseSchema)), {
    dataType: "json",
    validators: zod(LicenseSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.CustomCommand({
            command: "ensurelicense",
            data: JSON.stringify(form.data),
            jwt: auth.access_token,
          });
          toast.success("License updated");
          console.log(
            "data.item._stripeprice: ",
            data.item._stripeprice,
            "form.data._stripeprice: ",
            form.data._stripeprice,
          );
          if (data.item._stripeprice != form.data._stripeprice) {
            if (
              form.data._stripeprice == null ||
              form.data._stripeprice == ""
            ) {
              await auth.client.CustomCommand({
                command: "removeresourceusage",
                id: form.data._resourceusageid as any,
                jwt: auth.access_token,
              });
            } else {
              const product = products.find(
                (x: any) => x.stripeprice === form.data._stripeprice,
              );
              const { result, link } = JSON.parse(
                await auth.client.CustomCommand({
                  command: "createresourceusage",
                  data: JSON.stringify({
                    target: form.data,
                    billingid: form.data._billingid,
                    resourceid: data.resource._id,
                    productname: product?.name,
                    allowreplace: true,
                  }),
                  jwt: auth.access_token,
                }),
              );
              if (link != null && link != "") {
                document.location.href = link;
              }
            }
          }
          goto(base + `/licensekey`);
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
        loading = false;
        errormessage = "Form is invalid";
      }
    },
  });

  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });

  async function valuepromptdoaction() {
    if (valuepromptvalue <= 0) {
      toast.error("Error", {
        description: "Value must be greater than 0",
      });
    }
    try {
      loading = true;
      let adding =
        valuepromptaction == "addconnection" ||
        valuepromptaction == "addworkspace" ||
        valuepromptaction == "addgitrepo";
      let productname = "";
      if (valuepromptaction.indexOf("connection") > -1) {
        productname = "Additional connections";
      } else if (valuepromptaction.indexOf("workspace") > -1) {
        productname = "Additional workspaces";
      } else if (valuepromptaction.indexOf("gitrepo") > -1) {
        productname = "Additional getrepos";
      }

      const product = products.find((x: any) => x.name == productname);
      if (product == null)
        throw new Error("Failed to find `" + productname + "` product");
      const target = $state.snapshot($formData);
      if (adding) {
        const { result, link } = JSON.parse(
          await auth.client.CustomCommand({
            command: "createresourceusage",
            data: JSON.stringify({
              target,
              billingid: target._billingid,
              resourceid: data.resource._id,
              productname: product.name,
              quantity: valuepromptvalue,
            }),
            jwt: auth.access_token,
          }),
        );
        if (link != null && link != "") {
          document.location.href = link;
        }
        toast.success(
          "Resource " +
            productname +
            " assigned " +
            valuepromptvalue +
            " times",
        );

        data.item = await auth.client.FindOne({
          collectionname: "config",
          query: { _id: data.item._id },
          jwt: auth.access_token,
        });
        formData.set(data.item);
        validateForm({ update: true });
      } else {
        let existing = await auth.client.FindOne<ResourceUsage>({
          collectionname: "config",
          query: { licenseid: data.item._id, "product.valueadd": true },
          jwt: auth.access_token,
        });
        if (existing == null) {
          throw new Error(
            "Failed to find `" +
              productname +
              "` resource assigned to " +
              data.item._id,
          );
        }
        const { result, link } = JSON.parse(
          await auth.client.CustomCommand({
            command: "removeresourceusage",
            id: existing._id,
            data: JSON.stringify({
              quantity: valuepromptvalue,
            }),
            jwt: auth.access_token,
          }),
        );
        toast.success(
          "Resource `" +
            productname +
            "` removed " +
            valuepromptvalue +
            " times",
        );

        data.item = await auth.client.FindOne({
          collectionname: "config",
          query: { _id: data.item._id },
          jwt: auth.access_token,
        });
        formData.set(data.item);
        validateForm({ update: true });
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  let profileroles = auth.profile?.roles || [];
  const isAdmin = profileroles.includes("admins");
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
          disabled={loading}
          placeholder="Type name"
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.Description
      >This is the domain name ( fqdn ) of the OpenCore instance.</Form.Description
    >
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="_billingid">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Billing Account</Form.Label>
        <EntitySelector
          bind:value={$formData._billingid}
          collectionname="users"
          {loading}
          basefilter={{ _type: "customer" }}
        ></EntitySelector>
      {/snippet}
    </Form.Control>
    <Form.Description
      >License is linked to this Billing Account.</Form.Description
    >
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="_stripeprice">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>License</Form.Label>
        <CustomSelect
          {loading}
          {...props}
          bind:value={$formData._stripeprice}
          selectitems={products.filter((x: any) => x.valueadd == false)}
          triggerContent={triggerContentPlan}
          type="single"
        />
      {/snippet}
    </Form.Control>
    <Form.Description
      >License is linked to this Billing Account.</Form.Description
    >
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="connections">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Connections</Form.Label>
        <CustomInput
          disabled={true}
          placeholder="Type name"
          {...props}
          bind:value={$formData.connections}
        />
        <Button
          variant="outline"
          size="base"
          disabled={loading}
          onclick={() => {
            valuepromptaction = "addconnection";
            valueprompttitle = "Add connections";
            valuepromptdescription = "How many connections do you want to add?";
            valuepromptvalue = 1;
            valueprompt = true;
          }}
        >
          <Plus />
        </Button>
        <Button
          variant="outline"
          size="base"
          disabled={loading}
          onclick={() => {
            valuepromptaction = "removeconnection";
            valueprompttitle = "Remove connections";
            valuepromptdescription =
              "How many connections do you want to remove?";
            valuepromptvalue = 1;
            valueprompt = true;
          }}
        >
          <Minus />
        </Button>
      {/snippet}
    </Form.Control>
    <Form.Description>Max number of concurent connections.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="workspaces">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Workspaces</Form.Label>
        <CustomInput
          disabled={true}
          placeholder="Type name"
          {...props}
          bind:value={$formData.workspaces}
        />
        <Button
          variant="outline"
          size="base"
          disabled={loading}
          onclick={() => {
            valuepromptaction = "addworkspace";
            valueprompttitle = "Add workspaces";
            valuepromptdescription = "How many workspaces do you want to add?";
            valuepromptvalue = 1;
            valueprompt = true;
          }}
        >
          <Plus />
        </Button>
        <Button
          variant="outline"
          size="base"
          disabled={loading}
          onclick={() => {
            valuepromptaction = "removeworkspace";
            valueprompttitle = "Remove workspaces";
            valuepromptdescription =
              "How many workspaces do you want to remove?";
            valuepromptvalue = 1;
            valueprompt = true;
          }}
        >
          <Minus />
        </Button>
      {/snippet}
    </Form.Control>
    <Form.Description>Max number of workspaces.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="gitrepos">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Git repositories</Form.Label>
        <CustomInput
          disabled={true}
          placeholder="Type name"
          {...props}
          bind:value={$formData.gitrepos}
        />
        <Button
          variant="outline"
          size="base"
          disabled={loading}
          onclick={() => {
            valuepromptaction = "addgitrepo";
            valueprompttitle = "Add git repositories";
            valuepromptdescription =
              "How many git repositories do you want to add?";
            valuepromptvalue = 1;
            valueprompt = true;
          }}
        >
          <Plus />
        </Button>
        <Button
          variant="outline"
          size="base"
          disabled={loading}
          onclick={() => {
            valuepromptaction = "removegitrepo";
            valueprompttitle = "Remove git repositories";
            valuepromptdescription =
              "How many git repositories do you want to remove?";
            valuepromptvalue = 1;
            valueprompt = true;
          }}
        >
          <Minus />
        </Button>
      {/snippet}
    </Form.Control>
    <Form.Description>Max number of git repositories.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  {#if isAdmin}
    <Form.Field {form} name="_stripeprice">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>License version</Form.Label>
          <CustomSelect
            {loading}
            {...props}
            bind:value={$formData.licenseversion}
            selectitems={LicenseVersions}
            triggerContent={triggerContentVersion}
            type="single"
          />
        {/snippet}
      </Form.Control>
      <Form.Description
        >License is linked to this Billing Account.</Form.Description
      >
      <Form.FieldErrors />
    </Form.Field>
  {/if}

  <HotkeyButton
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Update licence"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Update licence</HotkeyButton
  >
  <HotkeyButton
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Update"
    onclick={async () => {
      try {
        loading = true;
        const payload: any = { domain: $formData.name };
        licensekey = await auth.client.CustomCommand({
          command: "issuelicense",
          data: JSON.stringify(payload),
          jwt: auth.access_token,
        });
        licensekey = licensekey.replace(/"/g, "");
        try {
          console.log("licensekey: ", atob(licensekey));
        } catch (error: any) {
          console.log("licensekey: ", licensekey, error.message);
        }
        showlicenseprompt = true;
      } catch (error: any) {
        toast.error("Error", {
          description: error.message,
        });
      } finally {
        loading = false;
      }
    }}
  >
    <KeyRound />
    Generate license key</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />

<AlertDialog.Root bind:open={valueprompt}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{valueprompttitle}</AlertDialog.Title>
      <AlertDialog.Description>
        {valuepromptdescription}
        <Input bind:value={valuepromptvalue} type="number" autofocus={true} />
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton disabled={loading} onclick={() => (valueprompt = false)}
        >Cancel</HotkeyButton
      >
      <HotkeyButton
        disabled={loading}
        onclick={() => {
          valuepromptdoaction();
          valueprompt = false;
        }}>Continue</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showlicenseprompt}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Description>
        <Textarea value={licensekey} class="h-[275px]" />
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        disabled={loading}
        onclick={() => (showlicenseprompt = false)}>Close</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
