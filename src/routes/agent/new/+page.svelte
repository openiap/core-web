<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import Customswitch from "$lib/customswitch/customswitch.svelte";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Timezoneselector from "$lib/timezoneselector/timezoneselector.svelte";
  import { Check, RefreshCcw, User } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import type { Workspace } from "../../workspace/schema.js";
  import { randomname } from "../helper.js";
  import { newFormSchema } from "../schema.js";

  const key = "agent";
  const { data } = $props();

  let loading = $state(false);
  let errormessage = $state("");
  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        let workspace: Workspace | null = null;
        let product = products.find(
          (x: any) => x.stripeprice == form.data._stripeprice,
        );
        try {
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
          let stripeprice = "";
          if (form.data._stripeprice != null && form.data._stripeprice != "") {
            if (product == null) {
              throw new Error("Product not found");
            }
            stripeprice = product.stripeprice;
          }
          form.data._stripeprice = "";

          const newagent = await auth.client.InsertOne<any>({
            collectionname: "agents",
            item: { ...form.data, _type: "agent" },
            jwt: auth.access_token,
          });
          toast.success("Agent created");
          try {
            if (workspace && stripeprice != "") {
              const { result, link } = JSON.parse(
                await auth.client.CustomCommand({
                  command: "createresourceusage",
                  data: JSON.stringify({
                    target: newagent,
                    billingid: workspace._billingid,
                    workspaceid: workspace._id,
                    resourceid: resource._id,
                    productname: product?.name,
                  }),
                  jwt: auth.access_token,
                }),
              );
              if (link != null && link != "") {
                document.location.href = link;
              }
              toast.success("Resource assigned");
            }
            goto(base + `/agent`);
          } catch (error: any) {
            toast.error("Error", {
              description: error.message,
            });
            cancel();
            goto(base + `/agent/${newagent._id}`);
          }
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
  const { form: formData, enhance, message } = form;

  $formData.name = randomname();
  $formData.slug = $formData.name;
  $formData.environment = {};
  $formData._stripeprice = "";
  $formData.image = auth.config?.agent_images[0].image;
  $formData.runas = auth.profile.sub;

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
      (x: any) => x.deprecated != true,
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
    var ram: number = product?.metadata?.resources?.limits?.memory as any;
    if (ram == null) {
      ram = product?.metadata?.resources?.requests?.memory as any;
    }
    if (ram == null) {
      ram = resource?.defaultmetadata?.resources?.limits?.memory;
    }
    if (ram == null) {
      ram = resource?.defaultmetadata?.resources?.requests?.memory;
    }

    if (ram == null) ram = "128Mi" as any;
    if ((ram as any).indexOf("Mi") > -1) {
      ram = (ram as any).replace("Mi", "");
      ram = parseInt(ram as any) / 1024;
    } else if ((ram as any).indexOf("Gi") > -1) {
      ram = (ram as any).replace("Gi", "");
      ram = parseInt(ram as any);
    }
    if ($formData.image == null) return;
    if ($formData.image.indexOf("openiap/nodechromiumagent") > -1) {
      if (product == null || ram < 0.25) {
        sizewarningtitle = "Not enough ram";
        if (
          auth.config?.stripe_api_key != null &&
          auth.config?.stripe_api_key != ""
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
          auth.config?.stripe_api_key != null &&
          auth.config?.stripe_api_key != ""
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
</script>

<div class="mx-6">
  {#if errormessage && errormessage != ""}
    {errormessage}
  {/if}

  {#if message && $message != ""}
    {$message}
  {/if}

  <form method="POST" use:enhance>
    <HotkeyButton
      class="w-full md:w-auto mb-4"
      variant="success"
      size="base"
      disabled={loading}
      aria-label="Create agent"
      type="submit"
      data-shortcut="ctrl+s"
    >
      <Check />
      Create agent</HotkeyButton
    >
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                aria-label="refresh"
                size="refresh"
                variant="refresh"
                title="refresh"
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
    </div>

    {#if sizewarningtitle != ""}
      <div
        class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-4 rounded relative"
      >
        <strong class="font-bold">{sizewarningtitle}</strong>
        <span class="block sm:inline">{sizewarning}</span>
      </div>
    {/if}

    <div class="mb-6 mt-4 md:mb-4 md:mt-2">
      <Form.Field {form} name="environment" class="min-h-52 w-full mb-4">
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

    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      <Form.Field
        {form}
        name="autostart"
        class="flex flex-row items-start space-x-3 space-y-0 mb-7 "
      >
        <Form.Control>
          {#snippet children({ props })}
            <div class="flex flex-col space-y-2">
              <Form.Label>Auto Start</Form.Label>
              <Form.Description></Form.Description>
              <div class="flex items-center space-x-4">
                <Customswitch
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
              <Form.Description></Form.Description>
              <div class="flex space-x-4">
                <Customswitch
                  disabled={loading}
                  bind:checked={$formData.webserver}
                  {...props}
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
              <Form.Description></Form.Description>
              <div class="flex space-x-4">
                <Customswitch
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

    <Form.Field {form} name="runas" class="mb-4">
      <Form.Control>
        {#snippet children({ props })}
          <div class="flex flex-col items-start space-y-2">
            <Form.Label class="me-6">Runas</Form.Label>
            <div class="md:flex md:items-center md:space-x-4 my-2">
              <Entityselector
                width="md:w-fit w-64"
                class="mb-2 md:mb-0"
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
  </form>

  <div class="italic text-gray-500 py-2">
    <div>
      Agents using free plan will be shutdown after {data.agentInstance
        ?.defaultmetadata.runtime_hours} hours. Buy one or more products on the customer
      page, and then assign it to an agent to allow it to run 24/7.
    </div>
    <div>
      You are limited to {data.agentInstance?.defaultmetadata.agentcount} free agents.
      Add more resources on the customer page to increase the limit.
    </div>
  </div>

  <CustomSuperDebug {formData} />
</div>
