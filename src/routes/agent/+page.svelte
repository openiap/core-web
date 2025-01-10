<script lang="ts" module>
  export let page = "agent";
  export let collectionname = "agents";
  export let query = { _type: "agent" };
</script>

<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Entities } from "$lib/entities/index.js";
  import Statuscard from "$lib/statuscard/statuscard.svelte";
  import {
    Box,
    DollarSign,
    EllipsisVertical,
    Filter,
    Pencil,
    Play,
    Plus,
    RefreshCcw,
    Square,
    Trash2,
    User,
    Webhook,
    Wrench,
  } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";

  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
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
      selected_items = selected_items.filter((i) => i !== item._id);
    } else {
      toast.error("Error while deleting", {
        description: "deletecount is " + deletecount,
      });
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
  }

  async function getPods() {
    try {
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
    } catch (error: any) {
      toast.error("Error while getting pods", {
        description: error.message,
      });
    }
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
      entities = await datacomponent.GetData(
        page,
        collectionname,
        query,
        auth.access_token,
      );
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  getPods();
</script>

<div class="flex justify-between">
  <div class="flex gap-2 w-full">
    <Searchinput {searchstring} />
    <HotkeyButton
      size="new"
      variant="new"
      aria-label="add"
      class="border-dashed dark:text-bw600"
    >
      <Filter />
      Filter</HotkeyButton
    >
  </div>

  <div class="flex gap-2">
    <HotkeyButton
      size="new"
      variant="new"
      aria-label="add"
      onclick={() => goto(base + `/${page}/new`)}
    >
      <Plus />
      Add {page}</HotkeyButton
    >
    <Hotkeybutton
      aria-label="packages"
      title="package"
      size="new"
      variant="new"
      onclick={() => goto(base + `/package`)}
    >
      <Box />
      Packages</Hotkeybutton
    >
    <Hotkeybutton
      aria-label="reload"
      title="reload"
      size="new"
      variant="new"
      onclick={async () => {
        entities = await datacomponent.GetData(
          page,
          collectionname,
          query,
          auth.access_token,
        );
        await getPods();
      }}
    >
      <RefreshCcw />
      Reload</Hotkeybutton
    >
  </div>
</div>

<!-- <div
  class="mb-4 border-b border-gray-300 flex justify-start pb-4 space-x-4 max-w-min"
>
  <Hotkeybutton
    aria-label="add"
    title="add"
    variant="default"
    onclick={() => goto(base + `/${page}/new`)}
  >
    <Plus />
    Add {page}</Hotkeybutton
  >
  <Hotkeybutton
    aria-label="packages"
    title="package"
    variant="default"
    onclick={() => goto(base + `/package`)}
  >
    <Box />
    Packages</Hotkeybutton
  >
  <Hotkeybutton
    aria-label="reload"
    title="reload"
    variant="default"
    onclick={async () => {
      entities = await datacomponent.GetData(
        page,
        collectionname,
        query,
        auth.access_token,
      );
      await getPods();
    }}
  >
    <RefreshCcw />
    Reload</Hotkeybutton
  >
</div> -->

<div class="mb-4">
  <RadioGroup.Root value="All" class="flex space-x-4">
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        value="All"
        id="r1"
        onclick={async () => {
          entities = await datacomponent.GetData(
            page,
            collectionname,
            query,
            auth.access_token,
          );
          getPods();
        }}
      />
      <Label for="r1" class="cursor-pointer">All</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        value="Daemon"
        id="r2"
        onclick={async () => {
          entities = await datacomponent.GetData(
            page,
            collectionname,
            {
              _type: "agent",
              daemon: true,
            },
            auth.access_token,
          );
          getPods();
        }}
      />
      <Label for="r2" class="cursor-pointer">Daemon</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        value="Pods"
        id="r3"
        onclick={async () => {
          const result = await datacomponent.GetData(
            page,
            collectionname,
            query,
            auth.access_token,
          );
          entities = result.filter((x: any) =>
            knownpods.some((y: any) => x._id === y.metadata.labels.agentid),
          );
          getPods();
        }}
      />
      <Label for="r3" class="cursor-pointer">Pods</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        value="Docker"
        id="r4"
        onclick={async () => {
          entities = await datacomponent.GetData(
            page,
            collectionname,
            {
              _type: "agent",
              docker: true,
            },
            auth.access_token,
          );
          getPods();
        }}
      />
      <Label for="r4" class="cursor-pointer">Docker</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        value="Assistant"
        id="r5"
        onclick={async () => {
          entities = await datacomponent.GetData(
            page,
            collectionname,
            {
              _type: "agent",
              assistant: true,
            },
            auth.access_token,
          );
          getPods();
        }}
      />
      <Label for="r5" class="cursor-pointer">Assistant</Label>
    </div>
  </RadioGroup.Root>
</div>

<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  delete_selected={deleteitems}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
>
  {#snippet status(item: any)}
    {#if item && item.status}
      <Statuscard bind:title={item.status as string} />
    {/if}
  {/snippet}
  {#snippet action(item: any)}
    <div class="flex items-center space-x-2">
      <Button
        aria-label="start"
        title="start"
        size="tableicon"
        variant="ghost"
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
        size="tableicon"
        variant="ghost"
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
        size="tableicon"
        variant="ghost"
        onclick={() => goto(base + `/${page}/${item._id}/run`)}
      >
        <Wrench />
      </Button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger><EllipsisVertical /></DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-56">
          <DropdownMenu.Item
            class="cursor-pointer"
            onclick={() => single_item_click(item)}
          >
            <Pencil class="mr-2 size-4" />
            <span>Edit</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item class="cursor-pointer">
            <Webhook class="mr-2 size-4" />
            <span>Webhook</span>
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
