<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import type { Billing } from "$lib/billing.svelte.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newWorkspaceSchema } from "../schema.js";

  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import { Label } from "$lib/components/ui/label/index.js";
    import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";

  const key = "workspace";
  const { data } = $props();
  let loading = $state(false);
  let currentworkspace = $state(data.currentworkspace);

  let nameprompt = $state(false);
  let newbillingaccountname = $state(auth.profile.name + "s Billing Account");

  let _billingid = "";
  if (data.currentbilling != null) {
    _billingid = data.currentbilling._id;
  }
  let billingid = $state(_billingid);
  let entities = $state(data.entities);
  const billingname = $derived(() => {
    if (billingid == null || billingid == "") return "Create new";
    let entity = entities.find((e) => e._id == billingid);
    if (entity == null) return "???";
    return entity.name;
  });

  const form = superForm(data.form, {
    dataType: "json",
    validators: zod(newWorkspaceSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        try {
          form.data._billingid = billingid;
          await auth.client.CustomCommand({
            command: "ensureworkspace",
            data: JSON.stringify(form.data),
            jwt: auth.access_token,
          });
          toast.success("Workspace updated");
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        }
      }
    },
  });
  const { form: formData, enhance, message } = form;

  async function createbillingaccount() {
    if (currentworkspace == null) {
      toast.error("No workspace selected");
      return;
    }
    if (newbillingaccountname == null || newbillingaccountname.trim() == "") {
      toast.error("Please enter a name for the billing account");
      newbillingaccountname = auth.profile.name + "s Billing Account";
      return;
    }
    let billingdata: any = {
      name: newbillingaccountname,
      email: auth.profile.email,
    };
    loading = true;
    try {
      const billing = JSON.parse(
        await auth.client.CustomCommand({
          command: "ensurebilling",
          data: JSON.stringify(billingdata),
          jwt: auth.access_token,
        }),
      );
      toast.success("Billing account created", {
        description: billing.name,
      });
      currentworkspace._billingid = billing._id;
      currentworkspace._billingid = billingid;
      await auth.client.CustomCommand({
        command: "ensureworkspace",
        data: JSON.stringify(currentworkspace),
        jwt: auth.access_token,
      });

      billingid = billing._id;
      await addplan();
    } catch (error: any) {
      toast.error("Error creating billing account", {
        description: error.message,
      });
    } finally {
      nameprompt = false;
      loading = false;
    }
  }
  async function addplan() {
    let id = currentworkspace?._id;
    try {
      loading = true;
      if (currentworkspace == null) throw new Error("No workspace selected");
      usersettings.currentworkspace = "";
      let resource = await auth.client.FindOne<any>({
        collectionname: "config",
        query: { name: "Workspaces" },
        jwt: auth.access_token,
      });
      if (resource == null) throw new Error("Could not find workspae resource");
      let product = resource.products.find((p: any) => p.name == "Basic tier");
      if (product == null) throw new Error("Could not find basic tier product");
      let billing: Billing;

      if (billingid == null || billingid == "") {
        nameprompt = true;
        return;
      }
      if (billingid == null || billingid == "") {
        let billingdata: any = {
          name: currentworkspace.name,
          email: auth.profile.email,
        };
        billing = JSON.parse(
          await auth.client.CustomCommand({
            command: "ensurebilling",
            data: JSON.stringify(billingdata),
            jwt: auth.access_token,
          }),
        );
        billingid = billing._id;
      }
      if (billingid == null || billingid == "") {
        throw new Error("Please select a billing account");
      }
      let data: any = {
        target: currentworkspace,
        workspace: currentworkspace._id,
        billingid,
        resourceid: resource._id,
        productname: product.name,
      };
      const { result, link } = JSON.parse(
        await auth.client.CustomCommand({
          command: "createresourceusage",
          data: JSON.stringify(data),
          jwt: auth.access_token,
        }),
      );
      if (link != null && link != "") {
        usersettings.currentworkspace = currentworkspace._id;
        await usersettings.dopersist();
        document.location.href = link;
        return;
      }
      entities = await datacomponent.GetData(
        "workspace",
        "users",
        { _type: "customer" },
        auth.access_token,
      );

      toast.success("Plan added");
      // goto(base + "/");
    } catch (error: any) {
      toast.error("Error adding plan", {
        description: error.message,
      });
    } finally {
      loading = false;
      if (id != null) {
        currentworkspace = await auth.client.FindOne({
          collectionname: "users",
          query: { _id: id },
          jwt: auth.access_token,
        });
        usersettings.currentworkspace = id;
        usersettings.persist();
      }
    }
  }
  async function removeplan() {
    let id = currentworkspace?._id;
    try {
      loading = true;
      if (currentworkspace == null) throw new Error("No workspace selected");
      if (
        currentworkspace._resourceusageid == null ||
        currentworkspace._resourceusageid == ""
      ) {
        throw new Error("No plan to remove");
      }
      usersettings.currentworkspace = "";
      await auth.client.CustomCommand({
        command: "removeresourceusage",
        id: currentworkspace._resourceusageid,
        jwt: auth.access_token,
      });
      entities = await datacomponent.GetData(
        "workspace",
        "users",
        { _type: "customer" },
        auth.access_token,
      );

      toast.success("Plan removed");
      // goto(base + "/");
    } catch (error: any) {
      toast.error("Error adding plan", {
        description: error.message,
      });
    } finally {
      loading = false;
      currentworkspace = await auth.client.FindOne({
        collectionname: "users",
        query: { _id: id },
        jwt: auth.access_token,
      });
      if (id != null) usersettings.currentworkspace = id;
    }
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}
<form method="POST" use:enhance>
  <Form.Field {form} name="name" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Workspace Name</Form.Label>
        <div class="flex space-x-5">
          <CustomInput {...props} bind:value={$formData.name} />
          {#if entities.length > 0}
            {#if currentworkspace._resourceusageid == "" || currentworkspace._resourceusageid == null}
              <span>Linked to billing account</span>
              <CustomSelect
                type="single"
                triggerContent={billingname}
                bind:value={billingid}
                selectitems={[{ name: "Create new", _id: "" }, ...entities]}
              />
            {:else if currentworkspace._billingid != null && currentworkspace._billingid != ""}
              <span>Linked to billing account</span>
              <Button
                variant="outline"
                size="base"
                disabled={loading}
                onclick={() =>
                  goto(base + "/billingaccount/" + currentworkspace._billingid)}
              >
                {billingname()}
              </Button>
            {/if}
          {/if}
          <Form.Button
            disabled={loading}
            aria-label="Update workspace"
            variant="success"
            size="base"
          >
            <Check />
            Update workspace</Form.Button
          >

          {#if data.currentbilling != null}
            <Button
              variant="outline"
              size="base"
              disabled={loading}
              onclick={() =>
                goto(base + "/workspace/" + currentworkspace._id + "/billing")}
            >
              Show billing usage for {currentworkspace.name}
            </Button>
          {/if}
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
</form>
<CustomSuperDebug {formData} />

<div class="flex justify-around">
  <Card.Root class="w-[350px] h-[500px] flex flex-col justify-around">
    <Card.Header>
      <Card.Title>Free tier</Card.Title>
      <Card.Description>Testing the platform</Card.Description>
    </Card.Header>
    <Card.Content>
      A workspace in the free tier will allow you to invite 5 members. You can
      run one free cloud agent in your workspace, that will automatically be
      turned off after 4 hours. You workspace will be subject to our fair use
      policy, regarding api request, active connections and database usage.
      Support though our <a href="https://discourse.openiap.io/" target="_blank"
        >community forum</a
      >.
    </Card.Content>
    <Card.Footer class="flex justify-between">
      {#if currentworkspace == null || currentworkspace._resourceusageid == null || currentworkspace._resourceusageid == ""}
        <HotkeyButton>Current</HotkeyButton>
      {:else}
        <HotkeyButton disabled={loading} onclick={removeplan}
          >Downgrade</HotkeyButton
        >
      {/if}
    </Card.Footer>
  </Card.Root>
  <Card.Root class="w-[350px] h-[500px] flex flex-col justify-around">
    <Card.Header>
      <Card.Title>Basic tier</Card.Title>
      <Card.Description>Starter package</Card.Description>
    </Card.Header>
    <Card.Content>
      You can invite up to 25 members to your workspace. You have the option to
      buy tiered cloud agents, that can run 24/7. You workspace will be subject
      to our fair use policy, regarding api request, active connections and
      database usage. Support though our <a
        href="https://discourse.openiap.io/"
        target="_blank">community forum</a
      >, for billing support please reach out using the email on the invoice.
    </Card.Content>
    <Card.Footer class="flex justify-between">
      <div></div>
      {#if currentworkspace == null || currentworkspace._resourceusageid == null || currentworkspace._resourceusageid == ""}
        <HotkeyButton disabled={loading} onclick={addplan}>Upgrade</HotkeyButton
        >
      {:else if currentworkspace._productname != "Basic tier"}
        <HotkeyButton disabled={loading} onclick={addplan}
          >Downgrade</HotkeyButton
        >
      {:else}
        <HotkeyButton>Current</HotkeyButton>
      {/if}
    </Card.Footer>
  </Card.Root>
  <Card.Root class="w-[350px] h-[500px] flex flex-col justify-around">
    <Card.Header>
      <Card.Title>Enterprise tier</Card.Title>
      <Card.Description>Deluxe offering</Card.Description>
    </Card.Header>
    <Card.Content>
      Please contact us for more information, to have unlimited members and api
      requests. Access to support via email/online meetings. Discounts on cloud
      agents.
    </Card.Content>
    <Card.Footer class="flex justify-between">
      <div></div>
      <HotkeyButton
        size="lg"
        disabled={loading}
        onclick={() =>
          window.open(
            "https://calendar.app.google/aoU5qv1gX6ocHnAH8",
            "_blank",
            "noopener,noreferrer",
          )}
      >
        Contact us
      </HotkeyButton>
    </Card.Footer>
  </Card.Root>
</div>

<AlertDialog.Root open={nameprompt}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Create Billing Account</AlertDialog.Title>
      <AlertDialog.Description>
        Please type the name of your new billing account.
        <Input bind:value={newbillingaccountname} />
        <Label>Select currency</Label>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton disabled={loading} onclick={() => (nameprompt = false)}
        >Cancel</HotkeyButton
      >
      <HotkeyButton disabled={loading} onclick={createbillingaccount}
        >Continue</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
