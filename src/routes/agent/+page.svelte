<script lang="ts" module>
  export let page = "agent";
  export let collectionname = "agents";
  export let query = { _type: "agent" };
</script>

<script lang="ts">
  import { browser } from "$app/environment";

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
  let ref: any;
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});
  let loading = $state(false);
  let knownpods: any = [];
  let clients: any = [];
  let filterby: "all" | "daemon" | "pods" | "docker" | "assistant" = "all";

  async function deleteitem(item: any) {
    try {
      await auth.client.CustomCommand({
        command: "deleteagent",
        id: item._id,
        name: item.slug,
        jwt: auth.access_token,
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
  async function GetData() {
    loading = true;
    try {
      let query: any = { _type: "agent" };
      if (filterby == "all") {
      } else if (filterby == "daemon") {
        query = { _type: "agent", daemon: true };
      } else if (filterby == "assistant") {
        query = { _type: "agent", assistant: true };
      } else if (filterby == "docker") {
        query = { _type: "agent", docker: true };
      } else if (filterby == "pods") {
        if (knownpods.length == 0) {
          await getPods(true);
        }
        query = {
          _id: { $in: knownpods.map((x: any) => x.metadata.labels.agentid) },
        };
      }
      if (
        usersettings.currentworkspace != null &&
        usersettings.currentworkspace != ""
      ) {
        query._workspaceid = usersettings.currentworkspace;
      }
      const _entities = await datacomponent.GetData(
        page,
        collectionname,
        query,
        auth.access_token,
      );
      if (filterby == "pods") {
        entities = _entities.filter((x: any) =>
          knownpods.some((y: any) => x._id === y.metadata.labels.agentid),
        );
        for (let i = 0; i < entities.length; i++) {
          let item = entities[i];
          getStatus(item);
        }
      } else {
        entities = _entities;
      }
    } catch (error: any) {
      toast.error("Error while getting data", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  async function deleteitems(ids: string[]) {
    let haderror = false;
    loading = true;
    showWarning = false;
    let counter = 0;
    try {
      for (let i = 0; i < ids.length; i++) {
        let id = ids[i];
        var item = entities.find((x: any) => x._id == id);
        if (item) {
          try {
            await auth.client.CustomCommand({
              command: "deleteagent",
              id: item._id,
              name: item.slug,
              jwt: auth.access_token,
            });
            counter++;
            selected_items = selected_items.filter((x: any) => x != item._id);
            GetData();
          } catch (error: any) {
            haderror = true;
            toast.error("Error while deleting", {
              description: error.message,
            });
            return;
          }
        }
      }
      if (!haderror) {
        toast.success(
          "Successfully deleted " + counter + " agent(s)",
          {
            description: "",
          },
        );
      }
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
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
  async function getPods(force: boolean) {
    loading = true;
    try {
      if (knownpods.length == 0 || force == true) {
        knownpods = JSON.parse(
          await auth.client.CustomCommand({
            command: "getagentpods",
            jwt: auth.access_token,
          }),
        );
      }
      if (clients.length == 0 || force == true) {
        clients = JSON.parse(
          await auth.client.CustomCommand({
            command: "getclients",
            jwt: auth.access_token,
          }),
        );
      }

      for (var x = 0; x < entities.length; x++) {
        getStatus(entities[x]);
      }
    } catch (error: any) {
      toast.error("Error while getting pods", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }

  async function handleAccept() {
    loading = true;
    try {
      showWarning = false;
      await auth.client.CustomCommand({
        command: "deleteagent",
        id: deleteData._id,
        name: deleteData.slug,
        jwt: auth.access_token,
      });
      selected_items = [];
      toast.success("Deleted successfully", {
        description: "",
      });
      await GetData();
      await getPods(false);
      usersettings.persist();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    } finally {
      showWarning = false;
      loading = false;
    }
  }
  if (browser) {
    getPods(false);
  }
</script>

<div class="flex justify-between">
  <div class="flex space-x-5 w-full">
    <SearchInput bind:searchstring />
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
      disabled={loading}
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
      disabled={loading}
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
      disabled={loading}
      onclick={async () => {
        await GetData();
        await getPods(true);
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
        disabled={loading}
        onclick={async () => {
          filterby = "all";
          await GetData();
          await getPods(false);
        }}
      />
      <Label for="r1" class="cursor-pointer">All</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
        value="Pods"
        id="r3"
        disabled={loading}
        onclick={async () => {
          filterby = "pods";
          await GetData();
        }}
      />
      <Label for="r3" class="cursor-pointer">Pods</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
        value="Daemon"
        id="r2"
        disabled={loading}
        onclick={async () => {
          filterby = "daemon";
          await GetData();
          await getPods(false);
        }}
      />
      <Label for="r2" class="cursor-pointer">Daemon</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
        value="Docker"
        id="r4"
        disabled={loading}
        onclick={async () => {
          filterby = "docker";
          await GetData();
          await getPods(false);
        }}
      />
      <Label for="r4" class="cursor-pointer">Docker</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item
        class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
        value="Assistant"
        id="r5"
        disabled={loading}
        onclick={async () => {
          filterby = "assistant";
          await GetData();
          await getPods(false);
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
  bind:this={ref}
>
  {#snippet status(item: any)}
    {#if item && item.status}
      <StatusCard bind:title={item.status as string} />
    {:else}
      <StatusCard title="missing" />
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
        disabled={loading}
        onclick={async () => {
          try {
            await auth.client.CustomCommand({
              command: "startagent",
              id: item._id,
              name: item.slug,
              jwt: auth.access_token,
            });
            toast.success("Started successfully", {
              description: "",
            });
            await getPods(true);
          } catch (error: any) {
            toast.error("Error while starting", {
              description: error.message,
            });
          }
        }}
      >
        <Play />
      </HotkeyButton>
      <HotkeyButton
        aria-label="stop"
        title="stop"
        size="tableicon"
        variant="icon"
        disabled={loading}
        onclick={async () => {
          try {
            await auth.client.CustomCommand({
              command: "stopagent",
              id: item._id,
              name: item.slug,
              jwt: auth.access_token,
            });
            toast.success("Stopped successfully", {
              description: "",
            });
            await getPods(true);
          } catch (error: any) {
            toast.error("Error while stopping", {
              description: error.message,
            });
          }
        }}
      >
        <Square />
      </HotkeyButton>
      <HotkeyButton
        aria-label="debug"
        title="debug"
        size="tableicon"
        variant="icon"
        disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept} disabled={loading}
></Warningdialogue>
