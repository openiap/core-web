<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import SuperDebug, { superForm, defaults } from "sveltekit-superforms";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { newFormSchema } from "../schema.js";
  import { zod } from "sveltekit-superforms/adapters";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import Timezoneselector from "$lib/timezoneselector/timezoneselector.svelte";
  import { auth } from "$lib/stores/auth.svelte";
  import { randomname } from "../helper.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { ArrowLeft, Check, RefreshCcw, User } from "lucide-svelte";
  import Switch from "$lib/components/ui/switch/switch.svelte";

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
          goto(base + `/${key}`);
        } catch (error: any) {
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
  const { form: formData, enhance, message } = form;

  $formData.name = randomname();
  $formData.slug = $formData.name;
  $formData.environment = {};
  $formData.stripeprice = "";
  $formData.image = "openiap/nodeagent";
  $formData.runas = auth.profile.sub;

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
  <HotkeyButton
    disabled={loading}
    aria-label="submit"
    onclick={() => goto(base + `/${key}`)}
    title="back"
  >
    <ArrowLeft />
    Back</HotkeyButton
  >
  <Form.Button disabled={loading} aria-label="submit" title="submit">
    <Check />
    Submit</Form.Button
  >

  <div class="flex items-center justify-between space-x-4 mb-2">
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
    <!-- <Form.Description>This is your environment.</Form.Description> -->
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
    <!-- <Form.Description>This is the name of the timezone.</Form.Description> -->
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
    <!-- <Form.Description>This is your runas.</Form.Description> -->
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button disabled={loading} aria-label="submit" title="submit">
    <Check />
    Submit</Form.Button
  >
</form>

<div class="italic text-gray-500 py-2">
  Agents using free plan will be shutdown after {data.agentInstance
    .defaultmetadata.runtime_hours} hours. Buy one or more products on the customer
  page, and then assign it to an agent to allow it to run 24/7. You are limited to
  {data.agentInstance.defaultmetadata.agentcount} free agents. Add more resources
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
