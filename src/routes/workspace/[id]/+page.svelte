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
  import { Check, Mail, SquareArrowDown, SquareArrowUp } from "lucide-svelte";
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
  let _workspaceid = data.currentworkspace._id;
  let loading = $state(false);
  let resourcecount = $state(data.resourcecount);
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

  const cardRoot = "w-[346px] h-[430px] dark:bg-bw850 grid grid-rows-4";
  const cardHeader = "text-center";
  const cardTitle = "text-bw950 dark:text-bw100";
  const cardDiv = "flex flex-col justify-between row-span-4";

  $effect(() => {
    if (
      usersettings.currentworkspace != "" &&
      _workspaceid != usersettings.currentworkspace
    ) {
      // goto(base + "/workspace/" + usersettings.currentworkspace);
      // window.location.href = base + "/workspace/" + usersettings.currentworkspace;
      goto(base + "/workspace/" + usersettings.currentworkspace + "/redirect");
    }
  });
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div class="lg:m-6">
  <form method="POST" use:enhance>
    <Form.Field {form} name="name" class="mb-7">
      <Form.Control>
        {#snippet children({ props })}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="grid grid-col-1 lg:grid-cols-1 gap-2">
              <Form.Label class="font-medium">Workspace Name</Form.Label>
              <div class="text-bw400">
                Your are managing the workspace below
              </div>
              <div class="flex space-x-5">
                <CustomInput {...props} bind:value={$formData.name} />
                <HotkeyButton
                  variant="success"
                  size="base"
                  disabled={loading}
                  aria-label="Update workspace"
                  type="submit"
                  data-shortcut="ctrl+s"
                >
                  <Check />
                  Update workspace</HotkeyButton
                >
              </div>
            </div>

            <div class="grid grid-col-1 lg:grid-cols-1 gap-2">
              {#if entities.length > 0}
                {#if resourcecount == 0}
                  <Form.Label>Workspace Billing</Form.Label>
                  <div class="text-bw400">
                    Select a billing account for this workspace
                  </div>
                  <CustomSelect
                    type="single"
                    triggerContent={billingname}
                    bind:value={billingid}
                    selectitems={[{ name: "Create new", _id: "" }, ...entities]}
                  />
                {:else}
                  <Form.Label>Workspace Billing</Form.Label>
                  <div class="text-bw400">
                    The current billing account for this workspace
                  </div>
                  <Button
                    class="max-w-xs"
                    variant="outline"
                    size="base"
                    disabled={loading}
                    onclick={() =>
                      goto(
                        base + "/billingaccount/" + currentworkspace._billingid,
                      )}
                  >
                    {billingname()}
                  </Button>
                {/if}
              {/if}
            </div>

            <div class="grid grid-col-1 lg:grid-cols-1 gap-2">
              {#if data.currentbilling != null}
                <Form.Label>Billing Account</Form.Label>
                <div class="text-bw400">
                  Show billing details for this specific workspace
                </div>
                <Button
                  class="max-w-xs"
                  variant="outline"
                  size="base"
                  disabled={loading}
                  onclick={() =>
                    goto(
                      base + "/workspace/" + currentworkspace._id + "/billing",
                    )}
                >
                  Show billing usage for {currentworkspace.name}
                </Button>
              {/if}
            </div>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  </form>

  <div class="mb-4">Plans</div>
  <div class="grid col-gap-4 row-gap-4 grid-cols-1 lg:grid-cols-3">
    <Card.Root class={cardRoot}>
      <Card.Header class={cardHeader}>
        <Card.Title class={cardTitle}>Free</Card.Title>
        <Card.Description>Great for trying things out</Card.Description>
      </Card.Header>
      <div class={cardDiv}>
        <Card.Content>
          <div class="flex">
            <Check class="mr-4 " />
            5 members in your workspace.
          </div>
          <div class="flex">
            <Check class="mr-4 " />
            1 cloud agent (4 hour runtime).
          </div>
          <div class="flex">
            <Check class="mr-4 " />
            Support via our
            <a href="https://discourse.openiap.io/" target="_blank"
              >{` community forum`}</a
            >.
          </div>
        </Card.Content>
        <Card.Footer class="flex justify-between">
          {#if currentworkspace == null || currentworkspace._resourceusageid == null || currentworkspace._resourceusageid == ""}
            <HotkeyButton>
              <Check class="p-0.5" />
              Current Plan</HotkeyButton
            >
          {:else}
            <HotkeyButton
              disabled={loading}
              onclick={removeplan}
              variant="danger"
            >
              <SquareArrowDown /> Downgrade</HotkeyButton
            >
          {/if}
        </Card.Footer>
      </div>
    </Card.Root>
    <Card.Root class={cardRoot}>
      <Card.Header class={cardHeader}>
        <Card.Title class={cardTitle}>Basic</Card.Title>
        <Card.Description>Starter package</Card.Description>
      </Card.Header>
      <div class={cardDiv}>
        <Card.Content>
          <div class="flex">
            <Check class="mr-4 " />
            25 members in your workspace
          </div>
          <div class="flex">
            <Check class="mr-4 " />
            Priced agents that run 24/7
          </div>
          <div class="flex">
            <Check class="mr-4 " />
            Support via our
            <a href="https://discourse.openiap.io/" target="_blank"
              >{` community forum`}</a
            >.
          </div>
          <div class="flex">
            <Check class="mr-7" />
            Billing support (reach out via the e-mail used in your invoice)
          </div>
        </Card.Content>
        <Card.Footer class="flex justify-between">
          {#if currentworkspace == null || currentworkspace._resourceusageid == null || currentworkspace._resourceusageid == ""}
            <HotkeyButton
              disabled={loading}
              onclick={addplan}
              variant="success"
            >
              <SquareArrowUp />
              Upgrade To Basic</HotkeyButton
            >
          {:else if currentworkspace._productname != "Basic tier"}
            <HotkeyButton disabled={loading} onclick={addplan} variant="danger">
              <SquareArrowDown />
              Downgrade</HotkeyButton
            >
          {:else}
            <HotkeyButton
              ><Check class="p-0.5" />
              Current Plan</HotkeyButton
            >
          {/if}
        </Card.Footer>
      </div>
    </Card.Root>
    <Card.Root class={cardRoot}>
      <Card.Header class={cardHeader}>
        <Card.Title class={cardTitle}>Enterprise</Card.Title>
        <Card.Description>Great for companies</Card.Description>
      </Card.Header>
      <div class={cardDiv}>
        <Card.Content>
          <div class="flex">
            <Check class="mr-4 " />
            Everything in the previous tiers
          </div>
          <div class="flex">
            <Check class="mr-4 " />
            Unlimited members
          </div>
          <div class="flex">
            <Check class="mr-4 " />
            Discount on agents that run 24/7
          </div>
          <div class="flex">
            <Check class="mr-7" />
            Billing support (reach out via the e-mail used in your invoice)
          </div>
          <div class="flex">
            <Check class="mr-4 " />
            Unlimited api requests
          </div>
        </Card.Content>
        <Card.Footer class="flex justify-between">
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
            <Mail />
            Contact us
          </HotkeyButton>
        </Card.Footer>
      </div>
    </Card.Root>
  </div>

  <AlertDialog.Root open={nameprompt}>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Create Billing Account</AlertDialog.Title>
        <AlertDialog.Description>
          Please type the name of your new billing account.
          <Input bind:value={newbillingaccountname} />
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
</div>

<CustomSuperDebug {formData} />
