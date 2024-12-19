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
  import { Trash2 } from "lucide-svelte";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";
  import { AnsiUp } from "ansi_up";
  import { json } from "@sveltejs/kit";
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
    console.log("packageData final", copyData);
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

<div>
  Edit {page}
</div>
<HotkeyButton
disabled={loading}
aria-label="Back"
onclick={() => goto(base + `/${page}`)}
title="back">Back</HotkeyButton
>
<!-- Performance monitor -->
{#if resourceMonitor != null}
  <div class="border rounded-xl p-2 my-2">
    <div>Resource monitor</div>
    <div>
      {resourceMonitor.metadata.name}
    </div>
    <hr />
    <div class="flex justify-start space-x-5 p-2">
      <div class="flex flex-col">
        <div>Status</div>
        <div>{resourceMonitor.showstatus}</div>
      </div>
      <div class="flex flex-col px-2 mx-2">
        <div>CPU</div>
        <div>
          {resourceMonitor.metrics.cpu +
            "/" +
            resourceMonitor.spec.containers[0].resources.limits.cpu}
        </div>
      </div>
      <div class="flex flex-col px-2 mx-2">
        <div>Men</div>
        <div>
          {resourceMonitor.metrics.memory +
            "/" +
            resourceMonitor.spec.containers[0].resources.limits.memory}
        </div>
      </div>
      <div class="flex flex-col">
        <div>Created</div>
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
  </div>
{/if}
{#if instancelog != null}
  <div class="border rounded-xl p-2 my-2">
    <div>Logs</div>
    {@html instancelog}
  </div>
{/if}

<form method="POST" use:enhance>
  <Form.Button disabled={loading} aria-label="submit" title="submit"
    >Submit</Form.Button
  >

  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input disabled={loading} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your public display name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="slug">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>slug</Form.Label>
        <Input disabled={loading} {...props} bind:value={$formData.slug} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your slug.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Button
    aria-label="refresh"
    title="refresh"
    disabled={loading}
    onclick={() => {
      $formData.name = randomname();
      $formData.slug = $formData.name;
    }}>Refresh</Button
  >

  <Form.Field {form} name="image">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>image</Form.Label>
        <Select.Root
          disabled={loading}
          {...props}
          type="single"
          bind:value={$formData.image}
          onValueChange={ImageUpdated}
        >
          <Select.Trigger class="w-[180px]">
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
    <Form.Description>This is the name of the image.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="stripeprice">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>plan</Form.Label>
        <Select.Root
          disabled={loading}
          {...props}
          type="single"
          bind:value={$formData.stripeprice}
          onValueChange={PlanUpdated}
        >
          <Select.Trigger class="w-[180px]">
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
    <Form.Description>This is the name of the image.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  {#if sizewarningtitle != ""}
    <div
      class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
    >
      <strong class="font-bold">{sizewarningtitle}</strong>
      <span class="block sm:inline">{sizewarning}</span>
    </div>
  {/if}

  <Form.Field {form} name="environment">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>environment</Form.Label>
        <ObjectInput
          disabled={loading}
          {...props}
          bind:value={$formData.environment}
        />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your environment.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
  <div>Options</div>
  <Form.Field
    {form}
    name="autostart"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.autostart}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>autostart</Form.Label>
          <Form.Description>
            If enabled, the user is autostart and cannot signin
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="webserver"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.webserver}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>webserver</Form.Label>
          <Form.Description>
            If enabled, the user is webserver and cannot signin
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field
    {form}
    name="sleep"
    class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
  >
    <Form.Control>
      {#snippet children({ props })}
        <Checkbox
          disabled={loading}
          {...props}
          bind:checked={$formData.sleep}
        />
        <div class="space-y-1 leading-none">
          <Form.Label>sleep</Form.Label>
          <Form.Description>
            If enabled, the user is sleep and cannot signin
          </Form.Description>
        </div>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="timezone">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>timezone</Form.Label>
        <Timezoneselector
          disabled={loading}
          {...props}
          bind:value={$formData.timezone}
        />
      {/snippet}
    </Form.Control>
    <Form.Description>This is the name of the timezone.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="runas">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>runas</Form.Label>
        <!-- <Input {...props} bind:value={$formData.runas} /> -->
        <Entityselector
          disabled={loading}
          {...props}
          collectionname="users"
          basefilter={{ _type: "user" }}
          bind:value={$formData.runas}
        />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your runas.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <hr />

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
        <div class="p-4 border rounded-xl flec flex-col space-y-4">
          {#if $formData.schedules}
            <div class="flex items-center space-x-2 justify-between">
              <div class="text-center">
                Package {index + 1}
              </div>
              <Button
                aria-label="Delete package"
                variant="destructive"
                onclick={() => {
                  showWarning = true;
                  deleteData = index;
                }}><Trash2 />Remove Schedule</Button
              >
            </div>

            <div class="flex items-center space-x-2">
              <Form.Field {form} name="schedules">
                <Form.Control>
                  <Form.Label>Name</Form.Label>
                  <Input bind:value={item.name} />
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            {#if item.cron != ""}
              <div class="flex items-center space-x-2">
                <Form.Field {form} name="schedules">
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
                <Form.Field {form} name="schedules">
                  <Form.Control>
                    <Checkbox
                      disabled={loading}
                      bind:checked={item.allowConcurrentRuns}
                    />
                    <div class="space-y-1 leading-none">
                      <Form.Label>Allow concurent runs</Form.Label>
                      <!-- <Form.Description>
                        If enabled, the user is autostart and cannot signin
                      </Form.Description> -->
                    </div>
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="flex items-center space-x-2">
                <Form.Field {form} name="schedules">
                  <Form.Control>
                    <Checkbox
                      disabled={loading}
                      bind:checked={item.terminateIfRunning}
                    />
                    <div class="space-y-1 leading-none">
                      <Form.Label>Terminate If Running</Form.Label>
                      <!-- <Form.Description>
                        If enabled, the user is autostart and cannot signin
                      </Form.Description> -->
                    </div>
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>
            {/if}

            <div class="flex items-center space-x-2">
              <Form.Field {form} name="schedules">
                <Form.Control>
                  <Checkbox disabled={loading} bind:checked={item.enabled} />
                  <div class="space-y-1 leading-none">
                    <Form.Label>Enabled</Form.Label>
                    <!-- <Form.Description>
                      If enabled, the user is autostart and cannot signin
                    </Form.Description> -->
                  </div>
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <div class="flex flex-col items-start space-y-2">
              <Form.Field {form} name="schedules">
                <Form.Control>
                  <Form.Label>Environment</Form.Label>
                  <ObjectInput disabled={loading} bind:value={item.env} />
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>
          {/if}
        </div>
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
