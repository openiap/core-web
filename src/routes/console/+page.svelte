<script lang="ts" module>
  export let page = "console";
  export let collectionname = "config";
  export let query = { _type: "config" };
</script>

<script lang="ts">
  import { Label } from "$lib/components/ui/label/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import SuperDebug from "sveltekit-superforms";
  let { data } = $props();
  import { auth } from "$lib/stores/auth.svelte.js";
  import { ObjectInput } from "$lib/objectinput";
  import { browser } from "$app/environment";
  import { Input } from "$lib/components/ui/input";

  if(data.config != null) {
    if(data.config.log_to_exchange == null) data.config.log_to_exchange = false;
    if(data.config.log_cache == null) data.config.log_cache = false;
    if(data.config.log_amqp == null) data.config.log_amqp = false;
    if(data.config.log_websocket == null) data.config.log_websocket = false;
    if(data.config.log_webserver == null) data.config.log_webserver = false;
    if(data.config.log_oauth == null) data.config.log_oauth = false;
    if(data.config.log_database == null) data.config.log_database = false;
    if(data.config.log_grafana == null) data.config.log_grafana = false;
    if(data.config.log_housekeeping == null) data.config.log_housekeeping = false;
    if(data.config.log_git == null) data.config.log_git = false;
    if(data.config.log_login_provider == null) data.config.log_login_provider = false;
    if(data.config.log_otel == null) data.config.log_otel = false;
    if(data.config.log_blocked_ips == null) data.config.log_blocked_ips = false;
    if(data.config.log_openapi == null) data.config.log_openapi = false;
    if(data.config.log_database_queries == null) data.config.log_database_queries = false;
    if(data.config.log_database_queries_ms == null) data.config.log_database_queries_ms = 100;
    if(data.config.log_all_watches == null) data.config.log_all_watches = false;
    if(data.config.log_debug == null) data.config.log_debug = false;
    if(data.config.log_verbose == null) data.config.log_verbose = false;
    if(data.config.log_silly == null) data.config.log_silly = false;
  }
  let config = $state(data.config);
  let showdebug = $state(false);
  let messages: any[] = $state([]);
  let pause = $state(false);
  let lines = $state(500);


  if (browser) {
    auth.client.RegisterExchange(
      { exchangename: "openflow_logs", algorithm: "fanout" },
      (msg, payload, user, jwt) => {
        if (pause == true) return;
        if (payload.lvl == 0) payload.lvl = "inf";
        if (payload.lvl == 1) payload.lvl = "err";
        if (payload.lvl == 2) payload.lvl = "war";
        if (payload.lvl == 3) payload.lvl = "inf";
        if (payload.lvl == 4) payload.lvl = "dbg";
        if (payload.lvl == 5) payload.lvl = "ver";
        if (payload.lvl == 6) payload.lvl = "sil";
        messages.unshift(payload);
        // if messages has more than 1000 rows, then remove the last 500 rows
        if (messages.length >= lines) messages.splice(lines - 1);
      },
    );
    // [{ "$match": { "fullDocument._type": "config" } }]
    // $.[?(@ && @._type == 'config')]
    auth.client
      .Watch(
        { collectionname: "config", paths: ["$.[?(@ && @._type == 'config')"] },
        (operation: any, document: any) => {
          if (document != null && document._type == "config") {
            config = document;
          }
        },
      )
      .then((watchid: any) => {
      });
  }
  function saveconfig(e: any) {
    setTimeout(() => {
      auth.client.UpdateOne({
        collectionname: "config",
        item: $state.snapshot(config),
        jwt: auth.access_token,
      }).then((result) => {
        console.log(result);
      });
    }, 250);
  }
</script>

{#if config != null}
  <div class="flex flex-col h-screen p-4 gap-4">
    <h1 class="text-2xl font-bold">Console</h1>
    <div class="flex flex-wrap gap-4">
      <div class="flex items-center space-x-2" >
        <Switch id="stream-logs" bind:checked={config.log_to_exchange} onclick={saveconfig} />
        <Label for="stream-logs" onclick={saveconfig}>Stream logs</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="stream-pause" bind:checked={pause} />
        <Label for="stream-pause">Pause stream</Label>
      </div>
      <div class="flex items-center gap-4">
        <Label>Max Lines</Label>
        <input
          type="number"
          bind:value={lines}
          min="100"
          max="10000"
          step="100"
          class="w-24 px-2 py-1 border rounded"
        />
      </div>
      <div class="flex items-center space-x-2">
        <Switch
          id="cache"
          bind:checked={config.log_cache}
        />
        <Label for="cache">Cache</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="amqp" bind:checked={config.log_amqp} onclick={saveconfig} />
        <Label for="amqp" onclick={saveconfig}>AMQP</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="websocket" bind:checked={config.log_websocket} onclick={saveconfig} />
        <Label for="websocket" onclick={saveconfig}>WebSocket</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="webserver" bind:checked={config.log_webserver} onclick={saveconfig} />
        <Label for="webserver" onclick={saveconfig}>Web server</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="oauth" bind:checked={config.log_oauth} onclick={saveconfig} />
        <Label for="oauth" onclick={saveconfig}>OAth</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="database" bind:checked={config.log_database} onclick={saveconfig} />
        <Label for="database" onclick={saveconfig}>Database</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="grafana" bind:checked={config.log_grafana} onclick={saveconfig} />
        <Label for="grafana" onclick={saveconfig}>Grafana</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="housekeeping" bind:checked={config.log_housekeeping} onclick={saveconfig} />
        <Label for="housekeeping" onclick={saveconfig}>House keeping</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="git" bind:checked={config.log_git} onclick={saveconfig} />
        <Label for="git" onclick={saveconfig}>git</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="login-provider" bind:checked={config.log_login_provider} onclick={saveconfig} />
        <Label for="login-provider" onclick={saveconfig}>Login provider</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="otel" bind:checked={config.log_otel} onclick={saveconfig} />
        <Label for="otel" onclick={saveconfig}>Otel</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="blocked-ips" bind:checked={config.log_blocked_ips} onclick={saveconfig} />
        <Label for="blocked-ips" onclick={saveconfig}>Blocked ips</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="openapi" bind:checked={config.log_openapi} onclick={saveconfig} />
        <Label for="openapi" onclick={saveconfig}>Open API</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch
          id="database-queries"
          bind:checked={config.log_database_queries} onclick={saveconfig}
        />
        <Label for="database-queries" onclick={saveconfig}>Database queries</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Input
          type="number"
          bind:value={config.log_database_queries_ms}
          onblur={saveconfig}
          min="100"
          max="10000"
          step="100"
          class="w-24 px-2 py-1 border rounded"
        />
        <Label for="database-queries-ms">Database queries ms</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="all-watches" bind:checked={config.log_all_watches} onclick={saveconfig} />
        <Label for="all-watches" onclick={saveconfig}>Watches</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="debug" bind:checked={config.log_debug} onclick={saveconfig} />
        <Label for="debug" onclick={saveconfig}>Debug</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="verbose" bind:checked={config.log_verbose} onclick={saveconfig} />
        <Label for="verbose" onclick={saveconfig}>Verbose</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Switch id="silly" bind:checked={config.log_silly} onclick={saveconfig} />
        <Label for="silly" onclick={saveconfig}>Silly</Label>
      </div>
    </div>

    <div class="flex-1 overflow-auto border rounded-lg">
      <div class="sticky top-0 bg-gray-100 dark:bg-gray-800">
        <div
          class="grid grid-cols-[auto_4rem_12rem_10rem_10rem_1fr] gap-2 p-2 font-bold text-sm"
        >
          <div>Level</div>
          <div>Host</div>
          <div>Class</div>
          <div>Function</div>
          <div>ms</div>
          <div>Message</div>
        </div>
      </div>

      <div class="divide-y dark:divide-gray-700">
        {#each messages as msg}
          <div
            class="grid grid-cols-[auto_4rem_12rem_10rem_10rem_1fr] gap-2 p-2 font-mono text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            class:bg-red-50={msg.lvl === "err"}
            class:dark:bg-red-900={msg.lvl === "err"}
            class:bg-yellow-50={msg.lvl === "war"}
            class:dark:bg-yellow-900={msg.lvl === "war"}
            class:bg-gray-50={msg.lvl === "dbg"}
            class:dark:bg-gray-800={msg.lvl === "dbg"}
            class:bg-blue-50={msg.lvl === "inf"}
            class:dark:bg-blue-900={msg.lvl === "inf"}
            class:bg-purple-50={msg.lvl === "ver"}
            class:dark:bg-purple-900={msg.lvl === "ver"}
          >
            <div class="uppercase font-bold">{msg.lvl}</div>
            <div class="truncate">{msg.host}</div>
            <div class="truncate">{msg.cls}</div>
            <div class="truncate">{msg.func}</div>
            <div>{msg.ms}</div>
            <div class="break-all whitespace-pre-wrap">{msg.message}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <div>Loading...</div>
{/if}

{#if showdebug == true}
  <SuperDebug data={config} theme="vscode" />
{/if}

<HotkeyButton
  hidden
  class="hidden"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
