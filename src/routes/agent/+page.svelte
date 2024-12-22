<script lang="ts" module>
  export let page = "agent";
  export let collectionname = "agents";
  export let query = { _type: "agent" };
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    DollarSign,
    Pencil,
    Play,
    Square,
    Trash2,
    User,
    Webhook,
    Eye,
    Wrench,
    EllipsisVertical,
  } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { data as data1 } from "$lib/entities/data.svelte.js";

  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

  let { data } = $props();
  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});
  let knownpods: any = [];
  let clients: any = [];

  async function deleteitem(item: any) {
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname,
      jwt: auth.access_token,
    });
    if (deletecount == 1) {
      entities = entities.filter((entity: any) => entity._id != item._id);
    } else {
      console.error(Error("deletecount is " + deletecount));
    }
  }
  function deleteitems(ids: string[]) {}
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
  function getStatus(model: any) {
    var instances = knownpods.filter(
      (x: any) =>
        (x.metadata.labels &&
          (x.metadata.labels.app == model.slug ||
            x.metadata.labels.slug == model.slug)) ||
        x.metadata.name == model.slug,
    );
    for (var x = 0; x < instances.length; x++) {
      var instance = instances[x];
      model.status = "missing";
      if (instance.status && instance.status.phase) {
        model.status = instance.status.phase;
      }
      if (model.status == "running" || model.status == "Running") {
        if (
          instance.status != null &&
          instance.status.containerStatuses != null &&
          instance.status.containerStatuses.length > 0
        ) {
          model.status = instance.status.containerStatuses[0].started
            ? "running"
            : "stopped " +
              instance.status.containerStatuses[0].state.waiting.reason;
        }
      }
      if (instance.metadata.deletionTimestamp) model.status = "deleting";
    }
    if (instances.length == 0) {
      model.status = "missing";
    }
    if (model.status == "missing") {
      if (model.image == null) {
        var cli1 = clients.filter(
          (x: any) =>
            x.user?._id == model.runas &&
            (x.agent == "nodeagent" || x.agent == "assistant"),
        );
        if (cli1 != null && cli1.length > 0) {
          model.status = "online";
        }
      } else if (model.image.indexOf("nodered") > -1) {
        var cli2 = clients.filter(
          (x: any) => x.user?._id == model.runas && x.agent == "nodered",
        );
        if (cli2 != null && cli2.length > 0) {
          model.status = "online";
        }
      } else if (model.image.indexOf("agent") > -1) {
        var cli3 = clients.filter(
          (x: any) =>
            x.user?._id == model.runas &&
            (x.agent == "nodeagent" || x.agent == "python"),
        );
        if (cli3 != null && cli3.length > 0) {
          model.status = "online";
        }
      }
    }
    // if (!this.$scope.$$phase) { this.$scope.$apply(); }
  }

  async function getPods() {
    if (knownpods.length == 0) {
      knownpods = JSON.parse(
        await auth.client.CustomCommand({ command: "getagentpods" }),
      );
    }
    if (clients.length == 0) {
      clients = JSON.parse(
        await auth.client.CustomCommand({ command: "getclients" }),
      );
    }

    for (var x = 0; x < entities.length; x++) {
      getStatus(entities[x]);
    }
    entities = entities;
  }

  async function handleAccept() {
    try {
      await auth.client.CustomCommand({
        command: "deleteagent",
        id: deleteData._id,
        name: deleteData.slug,
      });
      toast.success("Deleted successfully", {
        description: "",
      });
      entities = await data1.GetData(page, collectionname, query);
    } catch (error: any) {
      toast.error("Error white deleting", {
        description: error.message,
      });
      console.error(error);
    }
  }

  // $effect(() => {
  //   if (entities.length > 0) {
  //     getPods();
  //   }
  // });
  getPods();
</script>

<h1>All {page}s</h1>
<Hotkeybutton
  aria-label="add"
  title="add"
  variant={"outline"}
  onclick={() => goto(base + `/${page}/new`)}>Add {page}</Hotkeybutton
>
<Hotkeybutton
  aria-label="packages"
  title="package"
  variant={"outline"}
  onclick={() => goto(base + `/package`)}>Packages</Hotkeybutton
>
<Hotkeybutton
  aria-label="reload"
  title="reload"
  variant={"outline"}
  onclick={() => {
    goto(base + `/${page}`);
    getPods();
  }}>Reload</Hotkeybutton
>

<RadioGroup.Root value="All" class="flex space-x-2 my-2">
  <div class="flex items-center space-x-2">
    <RadioGroup.Item
      value="All"
      id="r1"
      onclick={async () => {
        entities = await data1.GetData(page, collectionname, query);
      }}
    />
    <Label for="r1" class="cursor-pointer">All</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item
      value="Daemon"
      id="r2"
      onclick={async () => {
        entities = await data1.GetData(page, collectionname, {
          _type: "agent",
          daemon: true,
        });
      }}
    />
    <Label for="r2" class="cursor-pointer">Daemon</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item
      value="Pods"
      id="r3"
      onclick={async () => {
        const result = await data1.GetData(page, collectionname, query);
        entities = result.filter((x: any) =>
          knownpods.some((y: any) => x._id === y.metadata.labels.agentid),
        );
      }}
    />
    <Label for="r3" class="cursor-pointer">Pods</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item
      value="Docker"
      id="r4"
      onclick={async () => {
        entities = await data1.GetData(page, collectionname, {
          _type: "agent",
          docker: true,
        });
      }}
    />
    <Label for="r4" class="cursor-pointer">Docker</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item
      value="Assistant"
      id="r5"
      onclick={async () => {
        entities = await data1.GetData(page, collectionname, {
          _type: "agent",
          assistant: true,
        });
      }}
    />
    <Label for="r5" class="cursor-pointer">Assistant</Label>
  </div>
</RadioGroup.Root>

<div class="flex w-full max-w-sm flex-col gap-1.5">
  <Label for="email">Search</Label>
  <div class="flex gap-1.5">
    <HotkeyInput
      type="text"
      id="searchstring"
      placeholder="Searchstring or JSON query"
      bind:value={searchstring}
      data-shortcut={"Control+f,Meta+f"}
    />
  </div>
</div>
<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  delete_selected={deleteitems}
  {single_item_click}
  bind:selected_items
  bind:entities
>
  {#snippet action(item: any)}
    <div class="flex items-center space-x-2">
      <Button
        aria-label="start"
        title="start"
        size="icon"
        variant="secondary"
        onclick={async () =>
          await auth.client.CustomCommand({
            command: "startagent",
            id: item._id,
            name: item.slug,
          })}
      >
        <Play />
      </Button>
      <Button
        aria-label="stop"
        title="stop"
        size="icon"
        variant="secondary"
        onclick={async () =>
          await auth.client.CustomCommand({
            command: "stopagent",
            id: item._id,
            name: item.slug,
          })}
      >
        <Square />
      </Button>
      <Button
        aria-label="debug"
        title="debug"
        size="icon"
        variant="secondary"
        onclick={() => goto(base + `/${page}/${item._id}/run`)}
      >
        <Wrench />
      </Button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger><EllipsisVertical /></DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-56">
          <DropdownMenu.Item class="cursor-pointer">
            <Webhook class="mr-2 size-4" />
            <span>Webhook</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            class="cursor-pointer"
            onclick={() => goto(base + `/${page}/${item._id}`)}
          >
            <Pencil class="mr-2 size-4" />
            <span>Edit</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item class="cursor-pointer">
            <DollarSign class="mr-2 size-4" />
            <span>Billing</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            class="cursor-pointer"
            onclick={() => goto(base + `/user/${item.runas}`)}
          >
            <User class="mr-2 size-4" />
            <span>User</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            class="text-red-500 cursor-pointer hover:text-white hover:bg-red-500 hover:bg-opacity-50"
            onclick={() => {
              deleteData = item;
              showWarning = !showWarning;
            }}
          >
            <Trash2 class="mr-2 size-4" />
            <span>Delete</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
