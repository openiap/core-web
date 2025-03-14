<script lang="ts" module>
  export let collectionname = "agents";
</script>

<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Accordion from "$lib/components/ui/accordion";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
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
    IdCard,
    Info,
    Laptop,
    Play,
    Podcast,
    RefreshCcw,
    Square,
    SquareActivity,
    Trash2,
    User,
    Webhook,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import type { Workspace } from "../../workspace/schema.js";
  import { randomname } from "../helper.js";
  import { editFormSchema } from "../schema.js";

  const { data } = $props();

  const ansi = new AnsiUp();
  const agent = data.item;
  let processes: any[] = $state([]);
  let packageId = $state("");
  let queuename = $state("");

  const ansi_up = new AnsiUp();

  if (data.item != null && data.item._stripeprice == null) {
    data.item._stripeprice = "";
  }
  const page = "agent";
  let loading = $state(false);
  let packageData: any = $state(null);

  let showWarning = $state(false);
  let showWarningAgentDelete = $state(false);
  let deleteData: any = $state({});
  let instancelog: any = $state(null);
  let openAccordion: Array<string> = $state([""]);

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
      }
    }
  }
  parsePods(data.instances);
  let instances: any = $state(data.instances);
  async function getPods(force: boolean = false) {
    try {
      loading = true;
      if (instances.length > 0 && force == false) return;
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
      toast.error("Error while getting pods", {
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
          if (auth.config?.workspace_enabled == true) {
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
            if (auth.config?.workspace_enabled == true && workspace != null) {
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
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        loading = false;
        let errors = Object.keys(form.errors).map((key) => key + " is " + form.errors[key]);
        if(errors.length > 0) {
          toast.error("Error", {
            description: errors.join(", "),
          });
        } else {
          toast.error("Error", {
            description: "Form is invalid",
          });
        }
        cancel();
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
  const images = auth.config?.agent_images ?? [];

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
    if ($formData.image != null && $formData.image.indexOf("openiap/nodeagent") > -1) {
      $formData.environment = {};
    }
    if ($formData.image != null && $formData.image.indexOf("openiap/noderedagent") > -1) {
      $formData.environment = {
        nodered_id: $formData.slug,
        admin_role: "users",
        api_role: "",
      };
    }
    if ($formData.image != null && $formData.image.indexOf("openiap/nodechromiumagent") > -1) {
      $formData.environment = {};
      PlanUpdated();
    }
    if ($formData.image != null && $formData.image.indexOf("openiap/dotnetagent") > -1) {
      $formData.environment = {};
    }
    if ($formData.image != null && $formData.image.indexOf("openiap/pyagent") > -1) {
      $formData.environment = {};
    }
    if ($formData.image != null && $formData.image.indexOf("openiap/pychromiumagent") > -1) {
      $formData.environment = {};
      PlanUpdated();
    }
    if ($formData.image != null && $formData.image.indexOf("openiap/grafana") > -1) {
      $formData.environment = {
        GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH:
          "contains(roles[*], 'users') && 'Admin'",
      };
      PlanUpdated();
    }
    if ($formData.image != null && $formData.image.indexOf("elsaworkflow") > -1) {
      var url =
        window.location.protocol +
        "//" +
        auth.config?.agent_domain_schema.replace("$slug$", $formData.slug);
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
        sizewarningtitle = "Not enough ram.";
        if (
          auth.config?.stripe_api_key != null &&
          auth.config?.stripe_api_key != ""
        ) {
          sizewarning =
            "This instance will not start, or will run extremly slow if not assigned a Payed plan with at least 256Mi ram or higher.";
        } else {
          sizewarning =
            "This instance will not start, or will run extremly slow if not assigned a plan with at least 256Mi ram or higher.";
        }
      }
    }
    if ($formData.image.indexOf("openiap/pychromiumagent") > -1) {
      if (product == null || (ram as any) < 0.25) {
        sizewarningtitle = "Not enough ram.";
        if (
          auth.config?.stripe_api_key != null &&
          auth.config?.stripe_api_key != ""
        ) {
          sizewarning =
            "This instance will not start, or will run extremly slow if not assigned a Payed plan with at least 256Mi ram or higher.";
        } else {
          sizewarning =
            "This instance will not start, or will run extremly slow if not assigned a plan with at least 256Mi ram or higher.";
        }
      }
    }
  }

  function addpackage() {
    if (packageData == null)
      return toast.error("Error while adding package", {
        description: "No package selected",
      });
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
    packageData = null;
    toast.success("Package added successfully", {
      description: `Package ${copyData.name} added`,
    });
  }
  async function handleAccept() {
    try {
      let index = deleteData;
      let arr = $formData.schedules;
      if (arr) {
        arr.splice(index, 1);
      }
      $formData.schedules = arr;
      toast.success("Killed successfully", {
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
      getPods();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  let firstListProcess = true;
  async function init() {
    try {
      queuename = await auth.client.RegisterQueue(
        {
          queuename: "",
          jwt: auth.access_token,
        },
        (msg, payload, user, jwt) => {
          switch (payload.command) {
            case "runpackage":
              if (payload.completed != true) {
                break;
              }
            case "completed":
              const element = document.getElementById(
                "process" + msg.correlationId,
              );
              if (element == null) {
                break;
              }
              // removing kill button
              element.remove();
              break;

            case "listprocesses":
              processes = payload.processes;
              openAccordion = processes.length > 0 ? [processes[0]?.id] : [""];
              processes.forEach((element) => {
                if (firstListProcess) {
                  auth.client.QueueMessage(
                    {
                      data: {
                        command: "setstreamid",
                        streamid: element.id,
                        streamqueue: queuename,
                      },
                      replyto: queuename,
                      queuename: agent.slug + "agent",
                      jwt: auth.access_token,
                    },
                    false,
                  );
                }
                // element.output = "";
              });
              firstListProcess = false;

              break;
            case "stream":
              let process = processes.find((p) => p.id == msg.correlationId);
              if (process == null) return;
              const decoder = new TextDecoder("utf-8");
              const _string = decoder.decode(
                new Uint8Array(payload.data.data as any),
              );
              const reversedString = _string.split("\n").reverse().join("\n");
              process.output = reversedString + process.output;

              break;
            default:
              break;
          }
        },
      );
      await pokeagent();
      await listprocesses();
    } catch (error: any) {
      toast.error("Error while initializing", {
        description: error.message,
      });
    }
  }
  async function pokeagent() {
    await auth.client.QueueMessage(
      {
        data: { command: "addcommandstreamid" },
        replyto: queuename,
        queuename: agent.slug + "agent",
        jwt: auth.access_token,
      },
      false,
    );
  }
  async function listprocesses() {
    await auth.client.QueueMessage(
      {
        data: { command: "listprocesses" },
        replyto: queuename,
        queuename: agent.slug + "agent",
        jwt: auth.access_token,
      },
      false,
    );
  }
  async function runpackage() {
    if (instances.length == 0)
      return toast.error("Error while running", {
        description: "No instances available",
      });
    if (packageId == "")
      return toast.error("Error while running", {
        description: "No package selected",
      });
    try {
      await auth.client.QueueMessage(
        {
          data: {
            command: "runpackage",
            id: packageId,
            stream: true,
            queuename: queuename,
          },
          queuename: agent.slug + "agent",
          jwt: auth.access_token,
        },
        false,
      );
      toast.success("Successfully Started Package", {
        description: `Package id ${packageId} started`,
      });
    } catch (error: any) {
      toast.error("Error while running", {
        description: error.message,
      });
    }
    packageId = "";
  }

  async function killpackage(id: string) {
    await auth.client.QueueMessage(
      {
        data: { command: "kill", id: id },
        queuename: agent.slug + "agent",
        jwt: auth.access_token,
      },
      false,
    );
  }

  async function handleAcceptRun() {
    try {
      await auth.client.QueueMessage(
        {
          data: { command: "kill", id: deleteData.id },
          queuename: agent.slug + "agent",
          jwt: auth.access_token,
        },
        false,
      );
      toast.success("Deleted successfully", {
        description: "",
      });
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<Tabs.Root value="2" class="w-full">
  <div class="flex flex-col lg:flex-row items-center mb-8">
    <Tabs.List
      class="h-fit grid grid-cols-1 md:block w-full md:w-fit bg-bw200 dark:bg-darkagenttab rounded-[15px] p-1 mb-2 lg:mb-0"
    >
      {#if $formData.docker == true}
        <Tabs.Trigger value="1" onclick={() => getPods()}>Pods</Tabs.Trigger>
      {/if}
      <Tabs.Trigger value="2">Settings</Tabs.Trigger>
      <Tabs.Trigger value="3">Scheduling</Tabs.Trigger>
      <Tabs.Trigger
        value="4"
        onclick={() => {
          if (browser) init();
        }}>Running Packages</Tabs.Trigger
      >
    </Tabs.List>
    <span class="flex item-center mx-0 lg:mx-5">
      <HotkeyButton
        aria-label="Start"
        size="tableicon"
        variant="icon"
        disabled={loading}
        onclick={async () => {
          try {
            loading = true;
            await auth.client.CustomCommand({
              command: "startagent",
              id: $formData._id,
              name: $formData.slug,
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
          } finally {
            loading = false;
          }
        }}
      >
        <Play />
      </HotkeyButton>
      <HotkeyButton
        aria-label="Stop"
        size="tableicon"
        variant="icon"
        disabled={loading}
        onclick={async () => {
          try {
            loading = true;
            await auth.client.CustomCommand({
              command: "stopagent",
              id: $formData._id,
              name: $formData.slug,
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
          } finally {
            loading = false;
          }
        }}
      >
        <Square />
      </HotkeyButton>
      <HotkeyButton
        aria-label="Refresh"
        size="tableicon"
        variant="icon"
        disabled={loading}
        onclick={async () => {
          try {
            await getPods(true);
          } catch (error: any) {
            toast.error("Error while refreshing", {
              description: error.message,
            });
          }
        }}
      >
        <RefreshCcw />
      </HotkeyButton>
      <HotkeyButton
        aria-label="Open in browser"
        size="tableicon"
        variant="icon"
        disabled={loading}
        onclick={() => window.open(auth.weburl($formData.slug), "_blank")}
        ><Webhook class="h1 w-1" size={1} /></HotkeyButton
      >
    </span>
  </div>
  <!-- <div class="flex">
    <HotkeyButton
      aria-label="Start"
      size="tableicon"
      variant="icon"
      disabled={loading}
      onclick={async () => {
        try {
          loading = true;
          await auth.client.CustomCommand({
            command: "startagent",
            id: $formData._id,
            name: $formData.slug,
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
        } finally {
          loading = false;
        }
      }}
    >
      <Play />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Stop"
      size="tableicon"
      variant="icon"
      disabled={loading}
      onclick={async () => {
        try {
          loading = true;
          await auth.client.CustomCommand({
            command: "stopagent",
            id: $formData._id,
            name: $formData.slug,
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
        } finally {
          loading = false;
        }
      }}
    >
      <Square />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Refresh"
      size="tableicon"
      variant="icon"
      disabled={loading}
      onclick={async () => {
        try {
          await getPods(true);
        } catch (error: any) {
          toast.error("Error while refreshing", {
            description: error.message,
          });
        }
      }}
    >
      <RefreshCcw />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Open in browser"
      size="tableicon"
      variant="icon"
      disabled={loading}
      onclick={() => window.open(auth.weburl($formData.slug), "_blank")}
      ><Webhook class="h1 w-1" size={1} /></HotkeyButton
    >
  </div> -->
  {#if $formData.docker == true}
    <Tabs.Content value="1">
      {#each instances as resourceMonitor}
        {#if resourceMonitor != null}
          <div
            class="my-4 text-[14px] border rounded-[10px] w-92 md:w-full overflow-hidden"
          >
            <div
              class="grid grid-cols-7 bg-lighttableheader dark:bg-darktableheader rounded-tr-[10px] rounded-tl-[10px] border-b overflow-auto"
            >
              <div class="ms-4 text-center p-2 col-span-2">
                <div class="flex items-center">
                  <IdCard class="h-4 w-4 mr-1 dark:text-bw500" />
                  Name
                </div>
              </div>
              <div class="text-center p-2 col-span-1">
                <div class="flex items-center justify-center">
                  <Gauge class="h-4 w-4 mr-1 dark:text-bw500" />
                  Status
                </div>
              </div>
              <div class="text-center p-2 col-span-1">
                <div class="flex items-center justify-center">
                  <Laptop class="h-4 w-4 mr-1 dark:text-bw500" />
                  CPU
                </div>
              </div>
              <div class="text-center p-2 col-span-1">
                <div class="flex items-center justify-center">
                  <SquareActivity class="h-4 w-4 mr-1 dark:text-bw500" />
                  Mem
                </div>
              </div>
              <div class="text-center p-2 col-span-2">
                <div class="flex items-center justify-center">
                  <CalendarDays class="h-4 w-4 mr-1 dark:text-bw500" />
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
              <div class="text-center p-4 col-span-1 text-wrap">
                {resourceMonitor?.metrics?.cpu +
                  "/" +
                  resourceMonitor?.spec?.containers[0]?.resources?.limits?.cpu}
              </div>
              <div class="text-center p-4 col-span-1 text-wrap">
                {resourceMonitor?.metrics?.memory +
                  "/" +
                  resourceMonitor?.spec?.containers[0]?.resources?.limits
                    ?.memory}
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
                  } catch (error: any) {
                    toast.error("Error while deleting", {
                      description: error.message ? error.message : error,
                    });
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
    </Tabs.Content>
  {/if}
  <Tabs.Content value="2">
    <form method="POST" use:enhance class="text-sm">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6"
      >
        <Form.Field {form} name="name" class="w-full">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Name</Form.Label>
              <CustomInput
                width="w-full"
                disabled={loading}
                bind:value={$formData.name}
              />
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
                  aria-label="Refresh"
                  size="refresh"
                  variant="refresh"
                  disabled={loading}
                  onclick={() => {
                    $formData.name = randomname();
                    $formData.slug = $formData.name;
                  }}><RefreshCcw /></HotkeyButton
                >
              </div>
              <CustomInput
                width="w-full"
                disabled={loading}
                {...props}
                bind:value={$formData.slug}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        {#if $formData.image != null && $formData.image != ""}
          <Form.Field {form} name="image" class="w-full">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Image</Form.Label>
                <CustomSelect
                  width="w-full"
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
                  width="w-full"
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
        {:else}
          <!-- add 2, to keep aligned with cloud agents -->
          <div class="w-full"></div>
          <div class="w-full"></div>
        {/if}
      </div>

      {#if sizewarningtitle != ""}
        <div
          class="flex items-center space-x-2 bg-bw200 text-bw950 dark:bg-bw600 dark:text-bw100 px-[10.5px] py-[15px] border rounded-[10px] mb-6"
        >
          <Info class="h-4 w-4" />
          <span> {sizewarningtitle}</span>
          <span class="block sm:inline">{sizewarning}</span>
        </div>
      {/if}

      <div class="mb-8">
        <Form.Field {form} name="environment" class="w-full">
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
      </div>

      {#if $formData.image != null && $formData.image != ""}
        <div
          class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-0 md:mb-8"
        >
          <Form.Field
            {form}
            name="autostart"
            class="flex flex-row items-start space-x-3 space-y-0 mb-8 md:mb-0"
          >
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-col space-y-2">
                  <Form.Label>Auto Start</Form.Label>
                  <Form.Description></Form.Description>
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
            class="flex flex-row items-start space-x-3 space-y-0 mb-8 md:mb-0"
          >
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-col space-y-2">
                  <Form.Label>Web Server</Form.Label>
                  <Form.Description></Form.Description>
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
            class="flex flex-row items-start space-x-3 space-y-0 mb-8 md:mb-0"
          >
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-col space-y-2">
                  <Form.Label>Sleep</Form.Label>
                  <Form.Description></Form.Description>
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

          <Form.Field {form} name="timezone" class="mb-8 md:mb-0">
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-col items-start space-y-2">
                  <Form.Label class="mb-1">Timezone</Form.Label>
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
        </div>
      {/if}

      <Form.Field {form} name="runas" class="mb-8">
        <Form.Control>
          {#snippet children({ props })}
            <div class="flex flex-col items-start space-y-2">
              <Form.Label>Runas</Form.Label>
              <div class="md:flex md:items-center md:space-x-4 my-2">
                <Entityselector
                  queryas={usersettings.currentworkspace}
                  width="md:w-fit w-64"
                  class="mb-4 md:mb-0"
                  disabled={loading}
                  {...props}
                  collectionname="users"
                  basefilter={{ _type: "user" }}
                  bind:value={$formData.runas}
                />
                <HotkeyButton
                  aria-label="User Details"
                  disabled={loading}
                  onclick={() => {
                    goto(base + `/user/${$formData.runas}`);
                  }}><User />User Details</HotkeyButton
                >
              </div>
            </div>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <!-- <div class="mb-4 space-y-2 md:space-x-4">
          {#if $formData.image != null && $formData.image != ""}
            <HotkeyButton
              class="w-full md:mr-4 md:w-auto"
              aria-label="Refresh"
              variant="base"
              size="base"
              disabled={loading}
              onclick={() => {
                getPods();
              }}
            >
              <RefreshCcw />
              Refresh</HotkeyButton
            >
          {/if}
        </div> -->

      <HotkeyButton
        class="w-full md:w-auto"
        variant="success"
        size="base"
        disabled={loading}
        aria-label="Update Agent"
        type="submit"
        data-shortcut="ctrl+s"
      >
        <Check />
        Update Agent</HotkeyButton
      >
    </form>

    {#if $formData.image != null && $formData.image != "" && data.agentInstance != null}
      <!-- <div class="italic text-gray-500 py-2">
          Agents using free plan will be shutdown after {data.agentInstance
            ?.defaultmetadata.runtime_hours} hours. Buy one or more products on the
          customer page, and then assign it to an Agent to allow it to run 24/7.
          You are limited to
          {data.agentInstance?.defaultmetadata.agentcount} free agents. Add more
          resources on the customer page to increase the limit.
        </div> -->
      <div class="italic text-gray-500 py-2">
        You are limited to {data.agentInstance?.defaultmetadata.agentcount} free
        agent, which will automatically shut down after {data.agentInstance
          ?.defaultmetadata.runtime_hours} hours. To keep your agent running 24/7,
        upgrade to a paid plan”
      </div>
    {/if}
  </Tabs.Content>
  <Tabs.Content value="3">
    <form method="POST" use:enhance class="text-sm">
      <div>
        <div class="mb-2">Add schedule of package</div>
        <div class="md:flex md:space-x-5 space-y-5 md:space-y-0 mb-10">
          <Entityselector
            queryas={agent?.runas}
            width="w-full md:w-[400px]"
            collectionname="agents"
            handleChangeFunction={() => {
              if (packageData?.daemon == false) {
                packageData.cron = "* * * * *";
              } else {
                packageData.cron = "";
              }
            }}
            basefilter={{
              _type: "package",
              language: { $in: $formData.languages },
            }}
            returnObject={true}
            bind:value={packageData}
          />

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
            Add Package</HotkeyButton
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
                    <CustomInput bind:value={item.name} width="" />
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              {#if item.cron != ""}
                <div class="mb-4">
                  <div class="flex items-center space-x-2 mb-4">
                    <Form.Field {form} name="item.cron">
                      <Form.Control>
                        <Form.Label>Cron</Form.Label>
                        <CustomInput
                          width=""
                          disabled={loading}
                          bind:value={item.cron}
                          placeholder="* * * * *"
                        />
                      </Form.Control>
                      <Form.FieldErrors />
                    </Form.Field>
                  </div>

                  <div class="flex items-center space-x-2 mb-4">
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

                  <div class="flex items-center space-x-2 mb-4">
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

      <HotkeyButton
        class="w-full md:w-auto"
        variant="success"
        size="base"
        disabled={loading}
        aria-label="Update Package"
        type="submit"
        data-shortcut="ctrl+s"
      >
        <Check />
        Update Package</HotkeyButton
      >
    </form>
  </Tabs.Content>
  <Tabs.Content value="4">
    <div class="text-sm mb-2">
      View Logs for packages running on {agent.name}
    </div>

    <div
      class={"md:flex items-center justify-start md:space-x-5 space-y-5 md:space-y-0 " +
        `${processes.length == 0 ? "" : "mb-10"}`}
    >
      <Entityselector
        width="w-full md:w-[400px]"
        queryas={agent.runas}
        collectionname="agents"
        basefilter={{ _type: "package", language: { $in: agent.languages } }}
        bind:value={packageId}
      />
      <HotkeyButton onclick={runpackage}>
        <Play />
        Run Package</HotkeyButton
      >
    </div>

    {#if processes.length > 0}
      <ul>
        <Accordion.Root
          type="multiple"
          class="w-full sm:max-w-[70%]"
          value={openAccordion}
        >
          {#each processes as process}
            <Accordion.Item value={process.id}>
              <Accordion.Trigger
                >{process.packagename}
                {process.schedulename}
                {process.id}
              </Accordion.Trigger>
              <Accordion.Content>
                <HotkeyButton
                  id={"process" + process.id}
                  disabled={loading}
                  onclick={() => {
                    deleteData = process;
                    showWarning = true;
                  }}
                  variant="danger">Kill process</HotkeyButton
                >
                <br />
                {@html ansi
                  .ansi_to_html(process.output)
                  .split("\n")
                  .join("<br>")}
              </Accordion.Content>
            </Accordion.Item>
          {/each}
        </Accordion.Root>
      </ul>
    {/if}
  </Tabs.Content>
</Tabs.Root>

{#if message && $message != ""}
  {$message}
{/if}

<CustomSuperDebug {formData} />

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>

<Warningdialogue
  bind:showWarning={showWarningAgentDelete}
  type="delete"
  onaccept={handleAcceptAgentDelete}
></Warningdialogue>
