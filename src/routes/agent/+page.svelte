<script lang="ts" module>
  export let page = "agent";
  export let collectionname = "agents";
  export let query = { _type: "agent" };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { StatusCard } from "$lib/statuscard/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import {
    Box,
    Ellipsis,
    Filter,
    Play,
    Plus,
    Receipt,
    RefreshCcw,
    Square,
    SquarePen,
    Trash2,
    User,
    Webhook,
    Wrench,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";

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
    try {
      await auth.client.CustomCommand({
        command: "deleteagent",
        id: item._id,
        name: item.slug,
      });
      toast.success("Deleted successfully", {
        description: "",
      });
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function deleteitems(ids: string[]) {
    let haderror = false;
    for (let i = 0; i < ids.length; i++) {
      let id = ids[i];
      var item = entities.find((x: any) => x._id == id);
      if (item) {
        try {
          await auth.client.CustomCommand({
            command: "deleteagent",
            id: item._id,
            name: item.slug,
          });
        } catch (error: any) {
          haderror = true;
          toast.error("Error while deleting", {
            description: error.message,
          });
          return;
        }
      }
    }
    entities = await datacomponent.GetData(
      page,
      collectionname,
      query,
      auth.access_token,
    );
    if (!haderror) {
      toast.success(
        "Successfully deleted " + selected_items.length + " agent(s)",
        {
          description: "",
        },
      );
    }
    selected_items = [];
    usersettings.persist();
  }
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

      await getPods();
      usersettings.persist();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  getPods();
</script>

<div class="flex justify-between">
  <div class="flex space-x-5 w-full">
    <SearchInput {searchstring} />
    <HotkeyButton
      size="sm"
      variant="base"
      aria-label="add"
      class="border-dashed dark:text-bw600"
    >
      <Filter />
      Filter</HotkeyButton
    >
  </div>

  <div class="flex space-x-5">
    <HotkeyButton
      size="sm"
      variant="base"
      aria-label="add"
      onclick={() => goto(base + `/${page}/new`)}
    >
      <Plus />
      Add {page}</HotkeyButton
    >
    <HotkeyButton
      aria-label="packages"
      title="package"
      size="sm"
      variant="base"
      onclick={() => goto(base + `/package`)}
    >
      <Box />
      Packages</HotkeyButton
    >
    <HotkeyButton
      aria-label="reload"
      title="reload"
      size="sm"
      variant="base"
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
      Reload</HotkeyButton
    >
  </div>
</div>

<div class="mb-4">
  <RadioGroup.Root value="All" class="flex space-x-4">
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
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
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
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
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
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
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
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
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
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
      <StatusCard bind:title={item.status as string} />
    {/if}
  {/snippet}
  {#snippet _productname(item: any)}
    {#if item && item._productname != null && item._productname != ""}
      {item._productname}
    {:else}
      Free tier
    {/if}
  {/snippet}
  {#snippet action(item: any)}
    <div class="flex items-center justify-center space-x-2.5">
      <HotkeyButton
        aria-label="start"
        title="start"
        size="tableicon"
        variant="icon"
        onclick={async () =>
          await auth.client.CustomCommand({
            command: "startagent",
            id: item._id,
            name: item.slug,
          })}
      >
        <Play />
      </HotkeyButton>
      <HotkeyButton
        aria-label="stop"
        title="stop"
        size="tableicon"
        variant="icon"
        onclick={async () =>
          await auth.client.CustomCommand({
            command: "stopagent",
            id: item._id,
            name: item.slug,
          })}
      >
        <Square />
      </HotkeyButton>
      <HotkeyButton
        aria-label="debug"
        title="debug"
        size="tableicon"
        variant="icon"
        onclick={() => goto(base + `/${page}/${item._id}/run`)}
      >
        <Wrench />
      </HotkeyButton>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger class="dark:text-bw300"
          ><Ellipsis /></DropdownMenu.Trigger
        >
        <DropdownMenu.Content class="w-44">
          <DropdownMenu.Item
            class="cursor-pointer"
            onclick={() => single_item_click(item)}
          >
            <div class="flex items-center">
              <SquarePen class="mr-2 size-4" />
              <span> Edit</span>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item class="cursor-pointer">
            <div class="flex items-center">
              <Webhook class="mr-2 size-4" />
              <span>Webhook</span>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item class="cursor-pointer">
            <div class="flex items-center">
              <Receipt class="mr-2 size-4" />
              <span>Billing</span>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            class="cursor-pointer"
            onclick={() => goto(base + `/user/${item.runas}`)}
          >
            <div class="flex items-center">
              <User class="mr-2 size-4" />
              <span>User</span>
            </div>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            class="cursor-pointer hover:bg-opacity-50"
            onclick={() => {
              deleteData = item;
              showWarning = !showWarning;
            }}
          >
            <div class="flex items-center">
              <Trash2 class="mr-2 size-4" />
              <span>Delete Agent</span>
            </div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
