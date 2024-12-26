<script lang="ts" module>
  export let collectionname = "agents";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Acl } from "$lib/acl";
  import { auth } from "$lib/stores/auth.svelte.js";

  import SuperDebug, { superForm, defaults } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { randomname } from "../helper.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import Timezoneselector from "$lib/timezoneselector/timezoneselector.svelte";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import {
    ArrowLeft,
    ArrowRight,
    Check,
    RefreshCcw,
    Trash2,
    User,
  } from "lucide-svelte";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";
  import { AnsiUp } from "ansi_up";
  import { json } from "@sveltejs/kit";
  import { preventDefault } from "svelte/legacy";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import Statuscard from "$lib/statuscard/statuscard.svelte";
  const ansi_up = new AnsiUp();

  const { data } = $props();
  const page = "agent";
  let loading = $state(false);
  let packageData: any = $state(null);
  let errormessage = $state("");
  let showdebug = $state(false);
  let showWarning = $state(false);
  let showWarningAgentDelete = $state(false);
  let deleteData: any = $state({});
  let instancelog: any = $state(null);
  let resourceMonitor: any = data.resourceMonitor;
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.UpdateOne({
            collectionname,
            item: { ...form.data },
            jwt: auth.access_token,
          });
          goto(base + `/${page}`);
        } catch (error: any) {
          // console.log("error", error);
          errormessage = error.message;
          cancel();
        } finally {
          loading = false;
        }
      } else {
        errormessage = "Form is invalid";
      }
    },
  });
  // console.log("instance", instance);
  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });

  const selectItems = [
    { value: "nodejs", label: "Nodejs" },
    { value: "python", label: "Python" },
    { value: "dotnet", label: "Dotnet" },
    { value: "rust", label: "Rust" },
    { value: "exec", label: "Exec" },
    { value: "powershell", label: "Powershell" },
  ];
  const triggerContent = $derived(
    selectItems.find((f) => f.value === $formData.language)?.label ??
      "Select a language",
  );
  const products = [
    { stripeprice: "", name: "Free tier" },
    ...data.agentInstance.products,
  ];
  const resource = data.agentInstance;
  const images = auth.config.agent_images;

  const triggerContentImage = $derived(
    () =>
      images.find((item: any) => item.image === $formData.image)?.name ??
      "Select an agent image",
  );

  const triggerContentPlan = $derived(
    () =>
      products.find((item: any) => item.stripeprice === $formData.stripeprice)
        ?.name ?? "Select an agent plan",
  );

  let sizewarningtitle = $state("");
  let sizewarning = $state("");

  function ImageUpdated() {
    $formData.webserver = false;
    sizewarningtitle = "";
    sizewarning = "";
    var image = images.find((x: any) => x.image == $formData.image);
    $formData.port = image.port;

    var languages = $formData.languages;
    if (
      image != null &&
      image.languages != null &&
      image.languages.length > 0
    ) {
      languages = image.languages;
    }
    var haschromium = false;
    var haschrome = false;
    if (image != null && image.chromium == true) {
      haschromium = true;
    }
    if (image != null && image.chrome == true) {
      haschrome = true;
    }
    if ($formData.port != null && $formData.port != 0) {
      $formData.webserver = true;
    } else {
      $formData.webserver = false;
    }
    if ($formData.image.indexOf("openiap/nodeagent") > -1) {
      // "gitrepo": "https://github.com/openiap/nodeworkitemagent.git",
      $formData.environment = {};
    }
    if ($formData.image.indexOf("openiap/noderedagent") > -1) {
      $formData.environment = {
        nodered_id: $formData.slug,
        admin_role: "users",
        api_role: "",
      };
      // try {
      //     var name = WebSocketClient.instance.user.username.toLowerCase();
      //     name = name.replace(/([^a-z0-9]+){1,63}/gi, "");
      //     $formData.environment["old_nodered_id"] = name;
      // } catch (error) {
      // }
    }
    if ($formData.image.indexOf("openiap/nodechromiumagent") > -1) {
      // "gitrepo": "https://github.com/openiap/nodepuppeteeragent.git",
      $formData.environment = {};
      PlanUpdated();
    }
    if ($formData.image.indexOf("openiap/dotnetagent") > -1) {
      // "gitrepo": "https://github.com/openiap/dotnetworkitemagent.git",
      $formData.environment = {};
    }
    if ($formData.image.indexOf("openiap/pyagent") > -1) {
      // "gitrepo": "https://github.com/openiap/pyworkitemagent.git",
      $formData.environment = {};
    }
    if ($formData.image.indexOf("openiap/pychromiumagent") > -1) {
      // "gitrepo3": "https://github.com/openiap/rccworkitemagent.git",
      // "gitrepo2": "https://github.com/openiap/robotframeworkagent.git",
      // "gitrepo": "https://github.com/openiap/taguiagent.git",
      $formData.environment = {};
      PlanUpdated();
    }
    if ($formData.image.indexOf("openiap/grafana") > -1) {
      $formData.environment = {
        GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH:
          "contains(roles[*], 'users') && 'Admin'",
      };
      PlanUpdated();
    }
    if ($formData.image.indexOf("elsaworkflow") > -1) {
      var url =
        window.location.protocol +
        "//" +
        auth.config.agent_domain_schema.replace("$slug$", $formData.slug);
      $formData.environment = {
        ELSA__SERVER__BASEURL: url,
      };
      PlanUpdated();
    }
  }

  function PlanUpdated() {
    sizewarningtitle = "";
    sizewarning = "";
    if (resource == null || products == null || products.length < 2) return; // no products, don't care
    var product = products.find(
      (x: any) => x.stripeprice == $formData.stripeprice,
    );
    if (product == null || product.stripeprice == "") product = null;
    var ram = product?.metadata?.resources?.limits?.memory;
    if (ram == null) {
      ram = product?.metadata?.resources?.requests?.memory;
    }
    if (ram == null) {
      ram = resource?.defaultmetadata?.resources?.limits?.memory;
    }
    if (ram == null) {
      ram = resource?.defaultmetadata?.resources?.requests?.memory;
    }

    if (ram == null) ram = "128Mi";
    if (ram.indexOf("Mi") > -1) {
      ram = ram.replace("Mi", "");
      ram = parseInt(ram) / 1024;
    } else if (ram.indexOf("Gi") > -1) {
      ram = ram.replace("Gi", "");
      ram = parseInt(ram);
    }
    if ($formData.image == null) return;
    if ($formData.image.indexOf("openiap/nodechromiumagent") > -1) {
      if (product == null || ram < 0.25) {
        sizewarningtitle = "Not enough ram";
        if (
          auth.config.stripe_api_key != null &&
          auth.config.stripe_api_key != ""
        ) {
          sizewarning =
            "This instance will not start, or will run extremly slow if not assigned a Payed plan with at least 256Mi ram or higher";
        } else {
          sizewarning =
            "This instance will not start, or will run extremly slow if not assigned a plan with at least 256Mi ram or higher";
        }
      }
    }
    if ($formData.image.indexOf("openiap/pychromiumagent") > -1) {
      if (product == null || ram < 0.25) {
        sizewarningtitle = "Not enough ram";
        if (
          auth.config.stripe_api_key != null &&
          auth.config.stripe_api_key != ""
        ) {
          sizewarning =
            "This instance will not start, or will run extremly slow if not assigned a Payed plan with at least 256Mi ram or higher";
        } else {
          sizewarning =
            "This instance will not start, or will run extremly slow if not assigned a plan with at least 256Mi ram or higher";
        }
      }
    }
  }

  function addpackage() {
    let copyData = {
      name: packageData.name,
      packageid: packageData._id,
      enabled: true,
      cron: "",
      terminateIfRunning: false,
      allowConcurrentRuns: true,
      env: {},
    };
    if (packageData.daemon == false) {
      copyData.cron = packageData.cron || "* * * * *";
    }
    if (
      $formData.schedules &&
      $formData.schedules.some(
        (schedule) => schedule.packageid === copyData.packageid,
      )
    ) {
      toast.error("Error while adding package", {
        description: "This schedule already exists.",
      });
    } else {
      $formData.schedules = [...($formData.schedules || []), copyData];
    }
  }
  async function handleAccept() {
    try {
      // await auth.client.CustomCommand({
      //   command: "deleteagent",
      //   id: deleteData._id,
      //   name: deleteData.slug,
      // });
      let index = deleteData;
      let arr = $formData.schedules;
      if (arr) {
        arr.splice(index, 1);
      }
      $formData.schedules = arr;
      toast.success("Deleted successfully", {
        description: "",
      });
      // entities = await data1.GetData(page, collectionname, query);
    } catch (error: any) {
      toast.error("Error white deleting", {
        description: error.message,
      });
      console.error(error);
    }
  }

  async function handleAcceptAgentDelete() {
    try {
      await auth.client.CustomCommand({
        command: "deleteagent",
        id: deleteData._id,
        name: deleteData.slug,
      });
      toast.success("Deleted successfully", {
        description: "",
      });
      goto(base + `/${page}`);
    } catch (error: any) {
      toast.error("Error white deleting", {
        description: error.message,
      });
      console.error(error);
    }
  }
  // async function getInstance() {
  //   let instance: any = await auth.client.CustomCommand({
  //     command: "getagentpods",
  //     id: data.item._id,
  //     name: data.item.slug,
  //     jwt: auth.access_token,
  //   });
  //   instance = JSON.parse(instance)[0];
  //   if (instance) {
  //     instance.showstatus = "unknown";
  //     if (instance.status && instance.status.phase) {
  //       instance.showstatus = instance.status.phase;
  //     }
  //     if (
  //       instance.showstatus == "running" ||
  //       instance.showstatus == "Running"
  //     ) {
  //       if (
  //         instance.status != null &&
  //         instance.status.containerStatuses != null &&
  //         instance.status.containerStatuses.length > 0
  //       ) {
  //         // instance.showstatus = instance.status.containerStatuses[0].state.running ? "running" : "stopped";
  //         instance.showstatus = instance.status.containerStatuses[0].started
  //           ? "Running"
  //           : "Stopped " +
  //             instance.status.containerStatuses[0].state.waiting.reason;
  //       }
  //     }
  //     if (instance.metadata.deletionTimestamp) instance.showstatus = "Deleting";
  //   }
  //   console.log("instance", instance);
  //   resourceMonitor = instance;
  // }
  // getInstance();
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

<div class="font-bold mb-4">
  Edit {page}
</div>
<HotkeyButton
  class="mb-4"
  disabled={loading}
  aria-label="Back"
  onclick={() => goto(base + `/${page}`)}
  title="back"
>
  <ArrowLeft />
  Back</HotkeyButton
>
<!-- Performance monitor -->
{#if resourceMonitor != null}
  <div class="my-2">
    <div>Resource monitor</div>
    <div class="font-bold mb-4">
      {resourceMonitor.metadata.name}
    </div>

    <!-- <div class=" p-2 border rounded mb-4">
      <div class="flex justify-between px-4">
        <div class="flex flex-col">
          <div class="text-center">Status</div>
          <Separator />
          <div>{resourceMonitor.showstatus}</div>
        </div>
        <div class="flex flex-col px-2 mx-2">
          <div class="text-center">CPU</div>
          <Separator />
          <div>
            {resourceMonitor.metrics.cpu +
              "/" +
              resourceMonitor.spec.containers[0].resources.limits.cpu}
          </div>
        </div>
        <div class="flex flex-col px-2 mx-2">
          <div class="text-center">Men</div>
          <Separator />
          <div>
            {resourceMonitor.metrics.memory +
              "/" +
              resourceMonitor.spec.containers[0].resources.limits.memory}
          </div>
        </div>
        <div class="flex flex-col">
          <div class="text-center">Created</div>
          <Separator />
          <div>{resourceMonitor.metadata.creationTimestamp}</div>
        </div>
      </div>

      <div>
        <Button
          variant="outline"
          aria-label="Logs"
          title="Logs"
          onclick={async () => {
            loading = true;
            try {
              instancelog = null;
              var lines: any = await auth.client.CustomCommand({
                command: "getagentlog",
                id: data.item._id,
                name: resourceMonitor.metadata.name,
              });
              lines = JSON.parse(lines);
              if (lines != null) {
                lines = ansi_up.ansi_to_html(lines);
                lines = lines.split("\n");
                // reverse lines
                lines = lines.reverse();
              } else {
                lines = [];
              }
              console.log("lines", lines);
              lines = lines.join("<br>");
              // instancelog = JSON.stringify(lines);
              instancelog = lines;
              console.log("instancelog", JSON.stringify(instancelog));
              errormessage = "";
            } catch (error: any) {
              errormessage = error.message ? error.message : error;
              instancelog = "";
            }
            loading = false;
          }}>Logs</Button
        >
        <Button
          variant="destructive"
          aria-label="Delete"
          title="Delete"
          onclick={() => {
            showWarningAgentDelete = true;
            deleteData = data.item;
          }}>Delete</Button
        >
      </div>
    </div> -->

    <div class="grid grid-cols-6 items-center justify-center border rounded">
      <div class="border-b text-center p-4 col-span-1">Status</div>
      <div class="border-b text-center p-4 col-span-2">CPU</div>
      <div class="border-b text-center p-4 col-span-2">Men</div>
      <div class="border-b text-center p-4 col-span-1">Created</div>
      <div class="flex items-center justify-center p-4 col-span-1">
        <Statuscard title={resourceMonitor.showstatus} />
      </div>
      <div class="text-center p-4 col-span-2">
        {resourceMonitor?.metrics?.cpu +
          "/" +
          resourceMonitor?.spec?.containers[0]?.resources?.limits?.cpu}
      </div>
      <div class="text-center p-4 col-span-2">
        {resourceMonitor?.metrics?.memory +
          "/" +
          resourceMonitor?.spec?.containers[0]?.resources?.limits?.memory}
      </div>
      <div class="text-center p-4 col-span-1">
        {resourceMonitor?.metadata?.creationTimestamp}
      </div>

      <div class="px-4 pb-4">
        <Button
          variant="outline"
          aria-label="Logs"
          title="Logs"
          onclick={async () => {
            loading = true;
            try {
              instancelog = null;
              var lines: any = await auth.client.CustomCommand({
                command: "getagentlog",
                id: data.item._id,
                name: resourceMonitor.metadata.name,
              });
              lines = JSON.parse(lines);
              if (lines != null) {
                lines = ansi_up.ansi_to_html(lines);
                lines = lines.split("\n");
                // reverse lines
                lines = lines.reverse();
              } else {
                lines = [];
              }
              lines = lines.join("<br>");
              // instancelog = JSON.stringify(lines);
              instancelog = lines;
              errormessage = "";
            } catch (error: any) {
              errormessage = error.message ? error.message : error;
              instancelog = "";
            }
            loading = false;
          }}>Logs</Button
        >
        <Button
          class="ml-4"
          variant="destructive"
          aria-label="Delete"
          title="Delete"
          onclick={() => {
            showWarningAgentDelete = true;
            deleteData = data.item;
          }}>Delete</Button
        >
      </div>
    </div>
  </div>
{/if}
{#if instancelog != null}
  <div class="border rounded-xl p-2 my-2">
    <div>Logs</div>
    {@html instancelog}
  </div>
{/if}

<form method="POST" use:enhance>
  <Form.Button
    disabled={loading}
    aria-label="submit"
    title="submit"
    class="mb-4"
  >
    <Check />
    Submit</Form.Button
  >

  <div class="flex items-center justify-between space-x-4">
    <Form.Field {form} name="name" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Name</Form.Label>
          <Input disabled={loading} bind:value={$formData.name} />
        {/snippet}
      </Form.Control>
      <!-- <Form.Description>This is your public display name.</Form.Description> -->
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="slug" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <div class="flex items-center">
            <Form.Label>Slug</Form.Label>
            <button
              class="ms-2 hover:opacity-80 border p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="refresh"
              title="refresh"
              disabled={loading}
              onclick={() => {
                $formData.name = randomname();
                $formData.slug = $formData.name;
              }}><RefreshCcw class="size-3" /></button
            >
          </div>
          <Input disabled={loading} {...props} bind:value={$formData.slug} />
        {/snippet}
      </Form.Control>
      <!-- <Form.Description>This is your slug.</Form.Description> -->
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="image" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Image</Form.Label>
          <Select.Root
            disabled={loading}
            {...props}
            type="single"
            bind:value={$formData.image}
            onValueChange={ImageUpdated}
          >
            <Select.Trigger>
              {triggerContentImage()}
            </Select.Trigger>
            <Select.Content>
              {#each images as image}
                <Select.Item value={image.image} label={image.name}
                  >{image.name}</Select.Item
                >
              {/each}
            </Select.Content>
          </Select.Root>
        {/snippet}
      </Form.Control>
      <!-- <Form.Description>This is the name of the image.</Form.Description> -->
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="stripeprice" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Plan</Form.Label>
          <Select.Root
            disabled={loading}
            {...props}
            type="single"
            bind:value={$formData.stripeprice}
            onValueChange={PlanUpdated}
          >
            <Select.Trigger>
              {triggerContentPlan()}
            </Select.Trigger>
            <Select.Content>
              {#each products as plan}
                <Select.Item value={plan.stripeprice} label={plan.name}
                  >{plan.name}</Select.Item
                >
              {/each}
            </Select.Content>
          </Select.Root>
        {/snippet}
      </Form.Control>
      <!-- <Form.Description>This is the name of the image.</Form.Description> -->
      <Form.FieldErrors />
    </Form.Field>
  </div>

  {#if sizewarningtitle != ""}
    <div
      class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-4 rounded relative"
    >
      <strong class="font-bold">{sizewarningtitle}</strong>
      <span class="block sm:inline">{sizewarning}</span>
    </div>
  {/if}

  <Form.Field {form} name="environment" class="mb-4">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Environment</Form.Label>
        <ObjectInput
          disabled={loading}
          {...props}
          bind:value={$formData.environment}
          class="min-h-52"
        />
      {/snippet}
    </Form.Control>
    <!-- <Form.Description>This is your environment.</Form.Description> -->
    <Form.FieldErrors />
  </Form.Field>
  <!-- <div>Options</div> -->
  <Form.Field
    {form}
    name="autostart"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-4">
          <Form.Label>Auto Start</Form.Label>
          <Form.Description>
            If enabled, the user is autostart and cannot signin
          </Form.Description>
          <div class="flex items-center space-x-4">
            <Switch
              disabled={loading}
              bind:checked={$formData.autostart}
              {...props}
              aria-readonly
            />
            <span> {$formData.autostart ? "On" : "Off"} </span>
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="webserver"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-4">
          <Form.Label>Web Server</Form.Label>
          <Form.Description>
            If enabled, the user is webserver and cannot signin
          </Form.Description>
          <div class="flex space-x-4">
            <Switch
              disabled={loading}
              bind:checked={$formData.webserver}
              {...props}
              aria-readonly
            />
            <span> {$formData.webserver ? "On" : "Off"} </span>
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="sleep"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-4">
          <Form.Label>Sleep</Form.Label>
          <Form.Description>
            If enabled, the user is sleep and cannot signin
          </Form.Description>
          <div class="flex space-x-4">
            <Switch
              disabled={loading}
              bind:checked={$formData.sleep}
              {...props}
              aria-readonly
            />
            <span> {$formData.sleep ? "On" : "Off"} </span>
          </div>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="timezone" class="mb-4">
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex items-center space-x-6">
          <Form.Label>Timezone</Form.Label>
          <Timezoneselector
            disabled={loading}
            {...props}
            bind:value={$formData.timezone}
          />
        </div>
      {/snippet}
    </Form.Control>
    <!-- <Form.Description>This is the name of the timezone.</Form.Description> -->
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="runas">
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex items-center space-x-5">
          <Form.Label class="me-6">Runas</Form.Label>
          <Entityselector
            disabled={loading}
            {...props}
            collectionname="users"
            basefilter={{ _type: "user" }}
            bind:value={$formData.runas}
          />
          <Button
            variant="outline"
            aria-label="Refresh"
            title="Refresh"
            disabled={loading}
            onclick={() => {
              goto(base + `/user/${$formData.runas}`);
            }}><User />User details</Button
          >
        </div>
      {/snippet}
    </Form.Control>
    <!-- <Form.Description>This is your runas.</Form.Description> -->
    <Form.FieldErrors />
  </Form.Field>

  <Separator class="my-6" />

  <div>Add schedule of package</div>
  <div class="flex space-x-2 my-2">
    <div class="flex items-center space-x-2">
      <data>Package</data>
      <Entityselector
        collectionname="agents"
        basefilter={{
          _type: "package",
          language: { $in: $formData.languages },
        }}
        returnObject={true}
        bind:value={packageData}
      />
    </div>

    {#if packageData?.daemon == false}
      <div class="flex items-center space-x-2">
        <data>Cron</data>
        <Input
          disabled={loading}
          bind:value={packageData.cron}
          placeholder="* * * * *"
        />
      </div>
    {/if}

    <Button onclick={addpackage}>Run package</Button>
  </div>

  <!-- schedules list -->
  {#if $formData.schedules}
    <div>Packages list</div>
    {#each $formData.schedules as item, index}
      <div class="flex items-center my-2">
        {#if $formData.schedules}
          <div class="p-4 border rounded-xl flex flex-col space-y-4 w-full">
            <div class="flex items-center space-x-2 justify-between">
              <div class="text-center">
                Package {index + 1}
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <Form.Field {form} name="item.name">
                <Form.Control>
                  <Form.Label>Name</Form.Label>
                  <Input bind:value={item.name} />
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            {#if item.cron != ""}
              <div class="flex items-center space-x-2">
                <Form.Field {form} name="item.cron">
                  <Form.Control>
                    <Form.Label>Cron</Form.Label>
                    <Input
                      disabled={loading}
                      bind:value={item.cron}
                      placeholder="* * * * *"
                    />
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="flex items-center space-x-2">
                <Form.Field {form} name="item.allowConcurrentRuns">
                  <Form.Control>
                    <div class="flex items-center justify-center space-x-2">
                      <Switch
                        disabled={loading}
                        bind:checked={item.allowConcurrentRuns}
                      />
                      <Form.Label
                        >Concurent Runs {item.allowConcurrentRuns
                          ? "On"
                          : "Off"}</Form.Label
                      >
                    </div>
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="flex items-center space-x-2">
                <Form.Field {form} name="item.terminateIfRunning">
                  <Form.Control>
                    <div class="flex items-center justify-center space-x-2">
                      <Checkbox
                        disabled={loading}
                        bind:checked={item.terminateIfRunning}
                      />
                      <Form.Label>Terminate If Running</Form.Label>
                    </div>
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>
            {/if}

            <div class="flex items-center space-x-2">
              <Form.Field {form} name="item.enabled">
                <Form.Control>
                  <div class="flex items-center justify-center space-x-2">
                    <Switch disabled={loading} bind:checked={item.enabled} />
                    <Form.Label
                      >Enabled {item.enabled ? "On" : "Off"}</Form.Label
                    >
                  </div>
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <div class="flex flex-col items-start space-y-2 w-full">
              <Form.Field {form} name="item.env">
                <Form.Control>
                  <Form.Label>Environment</Form.Label>
                  <ObjectInput disabled={loading} bind:value={item.env} />
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <Button
              class="max-w-fit"
              aria-label="Delete package"
              variant="destructive"
              onclick={() => {
                showWarning = true;
                deleteData = index;
              }}><Trash2 />Remove Schedule</Button
            >
          </div>
        {/if}
      </div>
    {/each}
  {:else}
    <div class="my-2">No packages found</div>
  {/if}

  <Form.Button disabled={loading} aria-label="submit" title="submit"
    >Submit</Form.Button
  >
</form>

{#if formData != null && showdebug == true}
  <SuperDebug data={formData} theme="vscode" />
{/if}

<HotkeyButton
  hidden
  class="hidden"
  aria-label="Toggle debug"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>

<Warningdialogue
  bind:showWarning={showWarningAgentDelete}
  type="delete"
  onaccept={handleAcceptAgentDelete}
></Warningdialogue>
