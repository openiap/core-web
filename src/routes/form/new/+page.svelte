<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Formio } from "formiojs";
  import { Check } from "lucide-svelte";
  import { onDestroy } from "svelte";
  import { toast } from "svelte-sonner";

  let builder: any = null as any;
  let ref = $state(null) as any;
  let loading = $state(false);
  let message = $state("");
  let data = $state({
    _type: "form",
    name: "",
    schema: {
      components: [
        {
          type: "textfield",
          key: "firstName",
          label: "First Name",
          placeholder: "Enter your first name.",
          input: true,
          tooltip: "Enter your <strong>First Name</strong>",
          description: "Enter your <strong>First Name</strong>",
        },
        {
          type: "textfield",
          key: "lastName",
          label: "Last Name",
          placeholder: "Enter your last name",
          input: true,
          tooltip: "Enter your <strong>Last Name</strong>",
          description: "Enter your <strong>Last Name</strong>",
        },
        {
          type: "select",
          label: "Favorite Things",
          key: "favoriteThings",
          placeholder: "These are a few of your favorite things...",
          data: {
            values: [
              {
                value: "raindropsOnRoses",
                label: "Raindrops on roses",
              },
              {
                value: "whiskersOnKittens",
                label: "Whiskers on Kittens",
              },
              {
                value: "brightCopperKettles",
                label: "Bright Copper Kettles",
              },
              {
                value: "warmWoolenMittens",
                label: "Warm Woolen Mittens",
              },
            ],
          },
          dataSrc: "values",
          template: "<span>{{ item.label }}</span>",
          multiple: true,
          input: true,
        },
        {
          type: "button",
          action: "submit",
          label: "Submit",
          theme: "primary",
        },
      ],
    },
  });

  async function createfrom() {
    loading = true;
    try {
      // @ts-ignore
      if (Formio == null || typeof Formio.builder !== "function") {
        console.log("Formio not loaded, try again in 200ms");
        setTimeout(async () => {
          createfrom();
        }, 200);
        return;
      }
    } catch (error) {
      console.log("Formio not loaded, try again in 200ms");
      setTimeout(async () => {
        createfrom();
      }, 200);
      return;
    }
    console.log("creating form");
    try {
      // builder = await Formio.createForm(ref, data.schema, {
      // @ts-ignore
      builder = await Formio.builder(ref, data.schema, {
        builder: {
          data: {
            display: "form",
            components: [],
          },
        },
      });
    } catch (e) {
      console.log(e);
    }
    loading = false;
  }
  let firstrun = $state(true);
  if (browser) {
    $effect(() => {
      if (ref != null && firstrun == true) {
        console.log("calling createfrom()");
        createfrom();
        firstrun = false;
      }
    });
    onDestroy(() => {
      try {
        builder.destroy();
      } catch (e) {}
    });
  }
  async function saveform() {
    message = "";
    if (data.name == "") {
      message = "Please enter form name";
      return;
    }
    // @ts-ignore
    data.schema = builder.schema;

    try {
      const result = await auth.client.InsertOne({
        collectionname: "forms",
        item: { ...data, _type: "form" },
        jwt: auth.access_token,
      });
      toast.success("Form created");
      goto(base + `/form`);
    } catch (error: any) {
      message = error.message;
      toast.error("Error", {
        description: error.message,
      });
    } finally {
    }
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="{base}/font-awesome/css/font-awesome.min.css" />
  <link rel="stylesheet" href="{base}/formio-dialog-content.css" />
  <link rel="stylesheet" href="{base}/formio.form.min.css" />
  <link rel="stylesheet" href="{base}/formio.builder.min.css" />
</svelte:head>

<div>
  {message}
</div>
<div>
  <div
    class="grid md:grid-cols-2 gap-2 xl:flex xl:items-center xl:justify-start xl:space-x-4 mb-4"
  >
    <CustomInput
      class="xl:max-w-sm"
      width="w-full"
      type="text"
      placeholder="Enter form name"
      bind:value={data.name}
    />
    <HotkeyButton
      variant="success"
      size="base"
      disabled={loading}
      onclick={saveform}
      aria-label="Create form"
      type="submit"
      data-shortcut="ctrl+s"
    >
      <Check />
      Create form</HotkeyButton
    >
  </div>
  <div
    class="bootstrap-scope formio-dialog-content dark:bg-bw1000"
    bind:this={ref}
  ></div>
</div>
