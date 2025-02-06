<script lang="ts" module>
  export let collectionname = "agents";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import Statuscard from "$lib/statuscard/statuscard.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Timezoneselector from "$lib/timezoneselector/timezoneselector.svelte";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { AnsiUp } from "ansi_up";
  import {
    Box,
    CalendarDays,
    Check,
    Gauge,
    Hourglass,
    Laptop,
    RefreshCcw,
    Tag,
    Trash2,
    User,
    Zap,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import type { Workspace } from "../../workspace/schema.js";
  import { randomname } from "../helper.js";
  import { editFormSchema } from "../schema.js";

  const ansi_up = new AnsiUp();

  const { data } = $props();
  if (data.item != null && data.item._stripeprice == null) {
    data.item._stripeprice = "";
  }
  const page = "agent";
  let loading = $state(false);
  let packageData: any = $state(null);
  let errormessage = $state("");
  let showWarning = $state(false);
  let showWarningAgentDelete = $state(false);
  let deleteData: any = $state({});
  let instancelog: any = $state(null);

  function parsePods(instances: any[]) {
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      if (instance) {
        instance.showstatus = "unknown";
        if (instance.status && instance.status.phase) {
          instance.showstatus = instance.status.phase;
        }
        if (
          instance.showstatus == "running" ||
          instance.showstatus == "Running"
        ) {
          if (
            instance.status != null &&
            instance.status.containerStatuses != null &&
            instance.status.containerStatuses.length > 0
          ) {
            instance.showstatus = instance.status.containerStatuses[0].started
              ? "Running"
              : "Stopped " +
                instance.status.containerStatuses[0].state.waiting.reason;
          }
        }
        if (instance.metadata.deletionTimestamp)
          instance.showstatus = "Deleting";
        console.log(instance.showstatus);
      }
    }
  }
  parsePods(data.instances);
  let instances: any = $state(data.instances);
  async function refreshPods() {
    try {
      loading = true;
      let instancejson: any = await auth.client.CustomCommand({
        command: "getagentpods",
        id: data.item._id,
        name: data.item.slug,
        jwt: auth.access_token,
      });
      const _instances = JSON.parse(instancejson);
      parsePods(_instances);
      instances = _instances;
    } catch (error: any) {
      toast.error("Error while refreshing", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }

  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        try {
          loading = true;
          let workspace: Workspace | null = null;
          let product = products.find(
            (x: any) => x.stripeprice == form.data._stripeprice,
          );
          if (auth.config.workspace_enabled) {
            let _workspaceid = form.data._workspaceid;
            if (_workspaceid == null || _workspaceid == "") {
              if (
                usersettings.currentworkspace == null ||
                usersettings.currentworkspace == ""
              ) {
                throw new Error("You must select a workspace first");
              }
              _workspaceid = usersettings.currentworkspace;
            }
            workspace = await auth.client.FindOne({
              collectionname: "users",
              query: {
                _type: "workspace",
                _id: _workspaceid,
              },
              jwt: auth.access_token,
            });
            if (workspace == null) {
              throw new Error("Workspace not found");
            }
            // @ts-ignore
            if (form.data._acl == null) {
              // @ts-ignore
              form.data._acl = [];
            }

            // @ts-ignore
            form.data._acl = [...form.data._acl, ...workspace._acl];
            if (auth.config.workspace_enabled && workspace != null) {
              form.data._workspaceid = workspace._id;
            }
          }
          if (form.data._stripeprice != null && form.data._stripeprice != "") {
            if (product == null) {
              throw new Error("Product not found");
            }
          }
          const savethis = { ...form.data };
          delete savethis._stripeprice;
          delete savethis._billingid;
          delete savethis._resourceusageid;
          delete savethis._productname;
          await auth.client.UpdateOne({
            collectionname,
            item: savethis,
            jwt: auth.access_token,
          });
          toast.success("Agent updated");
          if (
            workspace != null &&
            data.item._stripeprice != form.data._stripeprice
          ) {
            if (
              workspace != null &&
              form.data._stripeprice != null &&
              form.data._stripeprice != ""
            ) {
              if (product == null) {
                throw new Error("Product not found");
              }
              if (workspace._billingid == null || workspace._billingid == "") {
                throw new Error(
                  "workspace " +
                    workspace.name +
                    " does not have a billing account",
                );
              }
              if (product.stripeprice == "") {
                await auth.client.CustomCommand({
                  command: "removeresourceusage",
                  id: form.data._resourceusageid as any,
                  jwt: auth.access_token,
                });
              } else {
                const { result, link } = JSON.parse(
                  await auth.client.CustomCommand({
                    command: "createresourceusage",
                    data: JSON.stringify({
                      target: form.data,
                      billingid: workspace._billingid,
                      workspaceid: workspace._id,
                      resourceid: resource._id,
                      productname: product?.name,
                      allowreplace: true,
                    }),
                    jwt: auth.access_token,
                  }),
                );
                if (link != null && link != "") {
                  document.location.href = link;
                }
              }
            } else {
              await auth.client.CustomCommand({
                command: "removeresourceusage",
                id: form.data._resourceusageid as any,
                jwt: auth.access_token,
              });
            }
          }
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
    data.agentInstance.products = data.agentInstance.products.filter(
      (x: any) =>
        x.deprecated != true || x.stripeprice == $formData._stripeprice,
    );

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
      products.find((item: any) => item.stripeprice === $formData._stripeprice)
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
      (x: any) => x.stripeprice == $formData._stripeprice,
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
        command: "deleteagentpod",
        id: data.item._id,
        name: deleteData.metadata.name,
        jwt: auth.access_token,
      });
      toast.success("Deleted successfully", {
        description: "",
      });
      refreshPods();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<div class="px-6">
  {#if errormessage && errormessage != ""}
    {errormessage}
  {/if}

  {#if message && $message != ""}
    {$message}
  {/if}

  {#each instances as resourceMonitor}
    {#if resourceMonitor != null}
      <div class="my-4 text-[14px] border rounded-[10px]">
        <div
          class="grid grid-cols-7 bg-lighttableheader dark:bg-darktableheader rounded-tr-[10px] rounded-tl-[10px] border-b"
        >
          <div class="text-center p-2 col-span-2">
            <div class="flex items-center">
              <Tag class="h-3 w-3 mr-1" />
              Name
            </div>
          </div>
          <div class="text-center p-2 col-span-1">
            <div class="flex items-center justify-center">
              <Gauge class="h-4 w-4 mr-1" />
              Status
            </div>
          </div>
          <div class="text-center p-2 col-span-1">
            <div class="flex items-center justify-center">
              <Laptop class="h-4 w-4 mr-1" />
              CPU
            </div>
          </div>
          <div class="text-center p-2 col-span-1">
            <div class="flex items-center justify-center">
              <Zap class="h-4 w-4 mr-1" />
              Mem
            </div>
          </div>
          <div class="text-center p-2 col-span-2">
            <div class="flex items-center justify-center">
              <CalendarDays class="h-4 w-4 mr-1" />
              Created
            </div>
          </div>
        </div>

        <div class="grid grid-cols-7 border-b">
          <div class="flex items-center p-4 col-span-2">
            {resourceMonitor.metadata.name}
          </div>
          <div class="flex items-center justify-center p-4 col-span-1">
            <Statuscard title={resourceMonitor.showstatus} />
          </div>
          <div class="text-center p-4 col-span-1">
            {resourceMonitor?.metrics?.cpu +
              "/" +
              resourceMonitor?.spec?.containers[0]?.resources?.limits?.cpu}
          </div>
          <div class="text-center p-4 col-span-1">
            {resourceMonitor?.metrics?.memory +
              "/" +
              resourceMonitor?.spec?.containers[0]?.resources?.limits?.memory}
          </div>
          <div class="text-center p-4 col-span-2">
            {resourceMonitor?.metadata?.creationTimestamp}
          </div>
        </div>

        <div class="p-2">
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
                  jwt: auth.access_token,
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
            }}
          >
            <Hourglass />
            Logs</HotkeyButton
          >
          <HotkeyButton
            class="ml-4"
            variant="danger"
            aria-label="Delete"
            title="Delete"
            onclick={() => {
              showWarningAgentDelete = true;
              deleteData = resourceMonitor;
            }}
          >
            <Trash2 />
            Delete Item</HotkeyButton
          >
        </div>
      </div>
    {/if}
  {/each}
  {#if instancelog != null}
    <div class="border rounded-xl p-2 my-2">
      <div>Logs</div>
      {@html instancelog}
    </div>
  {/if}

  <form method="POST" use:enhance class="text-sm">
    <Form.Button
      disabled={loading}
      aria-label="Save changes"
      title="Save changes"
      variant="success"
      size="base"
      class="mb-4"
    >
      <Check />
      Save Changes</Form.Button
    >
    <HotkeyButton
      aria-label="Refresh"
      title="Refresh"
      variant="base"
      size="base"
      disabled={loading}
      onclick={() => {
        refreshPods();
      }}
    >
      <RefreshCcw />
      Refresh</HotkeyButton
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

      <Form.Field {form} name="_stripeprice" class="w-full">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Plan</Form.Label>
            <CustomSelect
              {loading}
              {...props}
              bind:value={$formData._stripeprice}
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

    <Form.Field {form} name="environment" class="mb-4 w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Environment</Form.Label>
          <ObjectInput
            disabled={loading}
            {...props}
            bind:value={$formData.environment}
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
          <div class="flex flex-col items-start space-y-2">
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
          <div class="flex flex-col items-start space-y-2">
            <Form.Label>Runas</Form.Label>
            <div class="flex items-center space-x-4">
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
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Separator class="my-6" />

    <div>
      <div>Add schedule of package</div>
      <div class="flex space-x-5 my-2">
        <div class="flex items-center space-x-8">
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

        <HotkeyButton onclick={addpackage}>
          <Box />
          Add package</HotkeyButton
        >
      </div>
    </div>

    {#if $formData.schedules}
      {#each $formData.schedules as item, index}
        <div class="my-4">
          {#if $formData.schedules}
            <div class="text-lg my-6">
              Package {index + 1}
            </div>

            <div class="flex items-center space-x-2 mb-4">
              <Form.Field {form} name="item.name">
                <Form.Control>
                  <Form.Label>Name</Form.Label>
                  <CustomInput bind:value={item.name} />
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            {#if item.cron != ""}
              <div class="mb-4">
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
              </div>
            {/if}

            <div class="flex items-center space-x-2 mb-4">
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

            <div class="mb-4">
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
    page, and then assign it to an agent to allow it to run 24/7. You are limited
    to
    {data.agentInstance?.defaultmetadata.agentcount} free agents. Add more resources
    on the customer page to increase the limit.
  </div>

  <CustomSuperDebug {formData} />

  <Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
  ></Warningdialogue>

  <Warningdialogue
    bind:showWarning={showWarningAgentDelete}
    type="delete"
    onaccept={handleAcceptAgentDelete}
  ></Warningdialogue>
</div>
