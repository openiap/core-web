<script lang="ts" module>
  export let collectionname = "agents";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import Statuscard from "$lib/statuscard/statuscard.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Timezoneselector from "$lib/timezoneselector/timezoneselector.svelte";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { AnsiUp } from "ansi_up";
  import { Check, RefreshCcw, Trash2, User } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { randomname } from "../helper.js";
  import { editFormSchema } from "../schema.js";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";

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
          toast.success("Agent updated");
          goto(base + `/${page}`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        } finally {
          loading = false;
        }
      } else {
        errormessage = "Form is invalid";
      }
    },
  });
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
  let products = $state([
    {
      stripeprice: "",
      name: "Free tier",
      metadata: {
        resources: {
          requests: { memory: "128Mi" },
          limits: { memory: "128Mi" },
        },
      },
    },
  ]);
  if (data.agentInstance != null) {
    products = [
      { stripeprice: "", name: "Free tier" },
      ...data.agentInstance.products,
    ];
  }
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
      $formData.environment = {};
    }
    if ($formData.image.indexOf("openiap/noderedagent") > -1) {
      $formData.environment = {
        nodered_id: $formData.slug,
        admin_role: "users",
        api_role: "",
      };
    }
    if ($formData.image.indexOf("openiap/nodechromiumagent") > -1) {
      $formData.environment = {};
      PlanUpdated();
    }
    if ($formData.image.indexOf("openiap/dotnetagent") > -1) {
      $formData.environment = {};
    }
    if ($formData.image.indexOf("openiap/pyagent") > -1) {
      $formData.environment = {};
    }
    if ($formData.image.indexOf("openiap/pychromiumagent") > -1) {
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
    if (product == null || product.stripeprice == "") product = null as any;
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
      ram = (parseInt(ram) / 1024) as any;
    } else if (ram.indexOf("Gi") > -1) {
      ram = ram.replace("Gi", "");
      ram = parseInt(ram) as any;
    }
    if ($formData.image == null) return;
    if ($formData.image.indexOf("openiap/nodechromiumagent") > -1) {
      if (product == null || (ram as any) < 0.25) {
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
      if (product == null || (ram as any) < 0.25) {
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
      let index = deleteData;
      let arr = $formData.schedules;
      if (arr) {
        arr.splice(index, 1);
      }
      $formData.schedules = arr;
      toast.success("Deleted successfully", {
        description: "",
      });
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
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
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

{#if resourceMonitor != null}
  <div class="my-2">
    <div>Resource monitor</div>
    <div class="font-bold mb-4">
      {resourceMonitor.metadata.name}
    </div>
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
        <HotkeyButton
          variant="base"
          size="base"
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
                lines = lines.reverse();
              } else {
                lines = [];
              }
              lines = lines.join("<br>");
              instancelog = lines;
              errormessage = "";
            } catch (error: any) {
              toast.error("Error while deleting", {
                description: error.message,
              });
              errormessage = error.message ? error.message : error;
              instancelog = "";
            }
            loading = false;
          }}>Logs</HotkeyButton
        >
        <HotkeyButton
          class="ml-4"
          variant="danger"
          aria-label="Delete"
          title="Delete"
          onclick={() => {
            showWarningAgentDelete = true;
            deleteData = data.item;
          }}>Delete</HotkeyButton
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
    aria-label="Update agent"
    title="Update agent"
    class="mb-4"
    variant="base"
    size="base"
  >
    <Check />
    Update agent</Form.Button
  >

  <div class="flex items-center justify-between space-x-4">
    <Form.Field {form} name="name" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Name</Form.Label>
          <CustomInput disabled={loading} bind:value={$formData.name} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="slug" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <div class="flex items-center">
            <Form.Label>Slug</Form.Label>
            <HotkeyButton
              class="ml-2"
              aria-label="refresh"
              size="refresh"
              variant="refresh"
              title="refresh"
              disabled={loading}
              onclick={() => {
                $formData.name = randomname();
                $formData.slug = $formData.name;
              }}><RefreshCcw class="h-4 w-4" /></HotkeyButton
            >
          </div>
          <CustomInput
            disabled={loading}
            {...props}
            bind:value={$formData.slug}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="image" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Image</Form.Label>
          <CustomSelect
            type="single"
            {loading}
            {...props}
            bind:value={$formData.image}
            onValueChangeFunction={ImageUpdated}
            selectitems={images}
            triggerContent={triggerContentImage}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="stripeprice" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Plan</Form.Label>
          <CustomSelect
            {loading}
            {...props}
            bind:value={$formData.stripeprice}
            onValueChangeFunction={PlanUpdated}
            selectitems={products}
            triggerContent={triggerContentPlan}
            type="single"
          />
        {/snippet}
      </Form.Control>
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
    <Form.FieldErrors />
  </Form.Field>
  <Form.Field
    {form}
    name="autostart"
    class="flex flex-row items-start space-x-3 space-y-0 mb-7 "
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-2">
          <Form.Label>Auto Start</Form.Label>
          <Form.Description>
            If enabled, the user is autostart and cannot signin
          </Form.Description>
          <div class="flex items-center space-x-4">
            <CustomSwitch
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-7 "
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-2">
          <Form.Label>Web Server</Form.Label>
          <Form.Description>
            If enabled, the user is webserver and cannot signin
          </Form.Description>
          <div class="flex space-x-4">
            <CustomSwitch
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
    class="flex flex-row items-start space-x-3 space-y-0 mb-7 "
  >
    <Form.Control>
      {#snippet children({ props })}
        <div class="flex flex-col space-y-2">
          <Form.Label>Sleep</Form.Label>
          <Form.Description>
            If enabled, the user is sleep and cannot signin
          </Form.Description>
          <div class="flex space-x-4">
            <CustomSwitch
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
          <HotkeyButton
            aria-label="User details"
            title="User details"
            disabled={loading}
            onclick={() => {
              goto(base + `/user/${$formData.runas}`);
            }}><User />User details</HotkeyButton
          >
        </div>
      {/snippet}
    </Form.Control>
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
        <CustomInput
          disabled={loading}
          bind:value={packageData.cron}
          placeholder="* * * * *"
        />
      </div>
    {/if}

    <HotkeyButton onclick={addpackage}>Run package</HotkeyButton>
  </div>

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
                  <CustomInput bind:value={item.name} />
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            {#if item.cron != ""}
              <div class="flex items-center space-x-2">
                <Form.Field {form} name="item.cron">
                  <Form.Control>
                    <Form.Label>Cron</Form.Label>
                    <CustomInput
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
                      <CustomSwitch
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
                      <CustomCheckbox
                        arialabel="Terminate If Running"
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
                    <CustomSwitch
                      disabled={loading}
                      bind:checked={item.enabled}
                    />
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

            <HotkeyButton
              class="max-w-fit"
              aria-label="Delete package"
              variant="danger"
              onclick={() => {
                showWarning = true;
                deleteData = index;
              }}><Trash2 />Remove Schedule</HotkeyButton
            >
          </div>
        {/if}
      </div>
    {/each}
  {:else}
    <div class="my-2">No packages found</div>
  {/if}
</form>

<div class="italic text-gray-500 py-2">
  Agents using free plan will be shutdown after {data.agentInstance
    ?.defaultmetadata.runtime_hours} hours. Buy one or more products on the customer
  page, and then assign it to an agent to allow it to run 24/7. You are limited to
  {data.agentInstance?.defaultmetadata.agentcount} free agents. Add more resources
  on the customer page to increase the limit.
</div>

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
