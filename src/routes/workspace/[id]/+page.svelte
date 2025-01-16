<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { toast } from "svelte-sonner";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newWorkspaceSchema } from "../schema.js";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";

  const key = "workspace";
  let showdebug = $state(false);
  const { data } = $props();
  let currentworkspace = $state(data.currentworkspace);

  let workspaces = $state(data.workspaces);
  let billingid = $state("");
  let entities = $state(data.entities);
  const billingname = $derived(() => {
    if (billingid == null || billingid == "") return "Billing Account";
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

  async function addplan() {
    let id = currentworkspace?._id;
    try {
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
      let billing: any;
      if (entities.length == 0) {
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
        console.log("billing", billing);
        billingid = billing._id;
      } else if (entities.length == 1) {
        billing = entities[0];
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
      await auth.client.CustomCommand({
        command: "createresourceusage",
        data: JSON.stringify(data),
        jwt: auth.access_token,
      });
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
      if (id != null) {
        currentworkspace = await auth.client.FindOne({
          collectionname: "users",
          query: { _id: id },
          jwt: auth.access_token,
        });
        usersettings.currentworkspace = id;
      }
    }
  }
  async function removeplan() {
    let id = currentworkspace?._id;
    try {
      if (currentworkspace == null) throw new Error("No workspace selected");
      if (
        currentworkspace.resourceusageid == null ||
        currentworkspace.resourceusageid == ""
      ) {
        throw new Error("No plan to remove");
      }
      let data = {
        target: currentworkspace,
        resourceusageid: currentworkspace.resourceusageid,
      };
      usersettings.currentworkspace = "";
      await auth.client.CustomCommand({
        command: "removeresourceusage",
        data: JSON.stringify(data),
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
  <!-- TODO: I don't beleive we should have ACL on this page ? -->
  <!-- <Acl bind:value={$formData} /> -->

  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Workspace Name</Form.Label>
        <div class="flex">
          <Input {...props} bind:value={$formData.name} />
          <Form.Button aria-label="submit">Update workspace</Form.Button>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
</form>
{#if formData != null && showdebug == true}
  <SuperDebug data={currentworkspace} theme="vscode" />
  <SuperDebug data={formData} theme="vscode" />
{/if}

<div class="flex">
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
      {#if currentworkspace == null || currentworkspace.resourceusageid == null || currentworkspace.resourceusageid == ""}
        <Button variant="outline">Current</Button>
      {:else}
        <Button onclick={removeplan}>Downgrade</Button>
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
      {#if currentworkspace == null || currentworkspace.productname != "Basic tier"}
        {#if entities.length == 0}
          <Button onclick={addplan}>Upgrade</Button>
        {:else}
          <Select.Root bind:value={billingid} type="single">
            <Select.Trigger>{billingname()}</Select.Trigger>
            <Select.Content>
              {#each entities as item}
                <Select.Item value={item._id} label={item.name}
                  >{item.name}</Select.Item
                >
              {/each}
            </Select.Content>
          </Select.Root>
          <Button onclick={addplan}>Upgrade</Button>
        {/if}
      {:else if currentworkspace.productname == "Basic tier"}
        <Button variant="outline" onclick={()=> goto(base + '/billingaccount/' + currentworkspace.billingid + "/billing" )}>Billing</Button>
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
      <Button
        size="lg"
        onclick={() =>
          window.open(
            "https://calendar.app.google/aoU5qv1gX6ocHnAH8",
            "_blank",
            "noopener,noreferrer",
          )}
      >
        Contact us
      </Button>
    </Card.Footer>
  </Card.Root>
</div>

<HotkeyButton
  hidden
  class="hidden"
  aria-label="Toggle debug"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
