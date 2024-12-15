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

  let config = $state(data.config);
  let showdebug = $state(false);
  let messages: any[] = $state([]);
  let pause = $state(false);
  let lines = $state(500);
  if (browser && lines == 500) {
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
    auth.client.Watch({ collectionname: "config",paths: ["$.[?(@ && @._type == 'config')"]}, (operation: any, document: any) => {
      console.log(operation, document);
      if(document != null && document._type == "config") {
        config = document;
      }
    }).then((watchid: any) => {
      console.log("watchid:", watchid);
    });
  }
  function saveconfig(e: any) {
    setTimeout(() => {
      auth.client.UpdateOne({  collectionname: "config", item: $state.snapshot(config), jwt: auth.access_token });
    }, 250);
  }
</script>

<div class="flex flex-col h-screen p-4 gap-4">
  <h1 class="text-2xl font-bold">Console</h1>
  <div class="flex flex-wrap gap-4">
    <div class="flex items-center space-x-2">
      <Switch id="stream-logs" bind:checked={config.log_to_exchange} />
      <Label for="stream-logs">Stream logs</Label>
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
      <Switch id="cache" bind:checked={config.log_cache} onclick={saveconfig} />
      <Label for="cache">Cache</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="amqp" bind:checked={config.log_amqp} />
      <Label for="amqp">AMQP</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="websocket" bind:checked={config.log_websocket} />
      <Label for="websocket">WebSocket</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="webserver" bind:checked={config.log_webserver} />
      <Label for="webserver">Web server</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="oauth" bind:checked={config.log_oauth} />
      <Label for="oauth">OAth</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="database" bind:checked={config.log_database} />
      <Label for="database">Database</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="grafana" bind:checked={config.log_grafana} />
      <Label for="grafana">Grafana</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="housekeeping" bind:checked={config.log_housekeeping} />
      <Label for="housekeeping">House keeping</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="git" bind:checked={config.log_git} />
      <Label for="git">git</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch
        id="login-provider"
        bind:checked={config.log_login_provider}
      />
      <Label for="login-provider">Login provider</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="otel" bind:checked={config.log_otel} />
      <Label for="otel">Otel</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="blocked-ips" bind:checked={config.log_blocked_ips} />
      <Label for="blocked-ips">Blocked ips</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="openapi" bind:checked={config.log_openapi} />
      <Label for="openapi">Open API</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch
        id="database-queries"
        bind:checked={config.log_database_queries}
      />
      <Label for="database-queries">Database queries</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Input
        type="number"
        bind:value={config.log_database_queries_ms}
        min="100"
        max="10000"
        step="100"
        class="w-24 px-2 py-1 border rounded"
      />
      <Label for="database-queries-ms">Database queries ms</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="all-watches" bind:checked={config.log_all_watches} />
      <Label for="all-watches">Watches</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="debug" bind:checked={config.log_debug} />
      <Label for="debug">Debug</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="verbose" bind:checked={config.log_verbose} />
      <Label for="verbose">Verbose</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch id="silly" bind:checked={config.log_silly} />
      <Label for="silly">Silly</Label>
    </div>
  </div>

  <div class="flex-1 overflow-auto border rounded-lg">
    <div class="sticky top-0 bg-gray-100 dark:bg-gray-800">
      <div
        class="grid grid-cols-[auto_4rem_12rem_10rem_10rem_1fr] gap-2 p-2 font-bold text-sm"
      >
        <div>Time</div>
        <div>Level</div>
        <div>Host</div>
        <div>Class</div>
        <div>Function</div>
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
          <div>{new Date(msg.ms).toLocaleTimeString()}</div>
          <div class="uppercase font-bold">{msg.lvl}</div>
          <div class="truncate">{msg.host}</div>
          <div class="truncate">{msg.cls}</div>
          <div class="truncate">{msg.func}</div>
          <div class="break-all whitespace-pre-wrap">{msg.message}</div>
        </div>
      {/each}
    </div>
  </div>
</div>

{#if showdebug == true}
  <SuperDebug data={config} theme="vscode" />
{/if}

<HotkeyButton
  hidden
  class="hidden"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
