<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  import Timezoneselector from "$lib/timezoneselector/timezoneselector.svelte";
  import { ArrowLeft, Check, RefreshCcw, User } from "lucide-svelte";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { randomname } from "../helper.js";
  import { newFormSchema } from "../schema.js";
    import { toast } from "svelte-sonner";

  const key = "agent";
  let showdebug = $state(false);
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
        try {
          const result = await auth.client.InsertOne({
            collectionname: "agents",
            item: { ...form.data, _type: "agent" },
            jwt: auth.access_token,
          });
          toast.success("Agent updated");
          goto(base + `/${key}`);
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
  $formData.stripeprice = "";
  $formData.image = "openiap/nodeagent";
  $formData.runas = auth.profile.sub;

  let products = $state([
    { stripeprice: "", name: "Free tier", metadata: { resources: {requests: { memory: "128Mi" },  limits: { memory: "128Mi" }  }  }},
  ]);
  if(data.agentInstance != null) {
    products = [{ stripeprice: "", name: "Free tier" }, ...data.agentInstance.products];
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
    var ram:number = product?.metadata?.resources?.limits?.memory as any;
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
      ram = parseInt((ram as any)) / 1024;
    } else if ((ram as any).indexOf("Gi") > -1) {
      ram = (ram as any).replace("Gi", "");
      ram = parseInt((ram as any));
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
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

<div class="font-bold mb-4">
  Add {key}
</div>

<form method="POST" use:enhance>
  <Form.Button disabled={loading} aria-label="Create agent" title="Create agent">
    <Check />
    Create agent</Form.Button
  >
  <HotkeyButton
    disabled={loading}
    aria-label="Cancel"
    onclick={() => goto(base + `/${key}`)}
    title="Cancel"
  >
    <ArrowLeft />
    Cancel</HotkeyButton
  >

  <div class="flex items-center justify-between space-x-4 mb-2">
    <Form.Field {form} name="name" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Name</Form.Label>
          <Input disabled={loading} bind:value={$formData.name} />
        {/snippet}
      </Form.Control>
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
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="runas" class="mb-4">
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
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button disabled={loading} aria-label="Create agent" title="Create agent">
    <Check />
    Create agent</Form.Button
  >
</form>

<div class="italic text-gray-500 py-2">
  Agents using free plan will be shutdown after {data.agentInstance?.defaultmetadata.runtime_hours} hours. Buy one or more products on the customer
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
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
