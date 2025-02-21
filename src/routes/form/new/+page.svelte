<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Formio } from "formiojs";
  import { Check } from "lucide-svelte";
  import { mode } from "mode-watcher";
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
  let firstrun = $state(true);

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
      updateStyle();
      builder.on("updateComponent", (component: any) => {
        console.log("updateComponent", component);
        updateStyle();
      });
    } catch (e) {
      console.log(e);
    }
    loading = false;
  }
  function updateStyle() {
    const refList1 =
      "input, select, textarea, div.card, div.dropdown, li.list-group-item, li.list-group-header, div.choices__inner, div.input-group-text, input.form-control, list-group-item";
    const sidebarRef1 = ref.querySelectorAll(refList1);
    if (sidebarRef1.length) {
      if ($mode === "dark") {
        console.log("dark mode: ", $mode);
        sidebarRef1.forEach((el: any) => {
          el.classList.add("darkTheme");
          el.classList.remove("lightTheme");
          el.classList.remove("bg-light");
        });
      } else if ($mode === "light") {
        console.log("light mode: ", $mode);
        sidebarRef1.forEach((el: any) => {
          el.classList.add("lightTheme");
          el.classList.remove("darkTheme");
        });
      } else {
        console.log("Uknown mode: ", $mode);
      }
    } else {
      console.warn("No elements in ref: ", refList1);
    }

    const refList2 =
      "[ref='button'], [ref='datagrid-dataMap-addRow'], [ref='editgrid-editGrid-addRow']";
    const sidebarRef2 = ref.querySelectorAll(refList2);
    if (sidebarRef2.length) {
      if ($mode === "dark") {
        sidebarRef2.forEach((el: any) => {
          el.classList.add("darkThemeButton");
          el.classList.remove("lightThemeButton");
        });
      } else if ($mode === "light") {
        sidebarRef2.forEach((el: any) => {
          el.classList.add("lightThemeButton");
          el.classList.remove("darkThemeButton");
        });
      } else {
        console.log("Uknown mode: ", $mode);
      }
    } else {
      console.warn("No elements in ref: ", refList2);
    }

    const refList3 = "[ref='sidebar-anchor']";
    const sidebarRef3 = ref.querySelectorAll(refList3);
    if (sidebarRef3.length) {
      if ($mode === "dark") {
        sidebarRef3.forEach((el: any) => {
          el.classList.add("darkThemeSidebarButton");
          el.classList.remove("lightThemeSidebarButton");
        });
      } else if ($mode === "light") {
        sidebarRef3.forEach((el: any) => {
          el.classList.add("lightThemeSidebarButton");
          el.classList.remove("darkThemeSidebarButton");
        });
      } else {
        console.log("Uknown mode: ", $mode);
      }
    } else {
      console.warn("No elements in ref: ", refList3);
    }

    const refList4 = "div.form-builder-panel";
    const sidebarRef4 = ref.querySelectorAll(refList4);
    if (sidebarRef4.length) {
      sidebarRef4.forEach((el: any) => {
        el.classList.add("themeMargin");
      });
    } else {
      console.warn("No elements in ref: ", refList4);
    }

    const refList5 = "table";
    const sidebarRef5 = ref.querySelectorAll(refList5);
    console.log("sidebarRef5: ", sidebarRef5);
    if (sidebarRef5.length) {
      if ($mode === "dark") {
        console.log("dark mode: ", $mode);
        sidebarRef5.forEach((el: any) => {
          el.classList.add("darkTheme");
          el.classList.remove("lightTheme");
          el.classList.remove("bg-light");
        });
      } else if ($mode === "light") {
        console.log("light mode: ", $mode);
        sidebarRef5.forEach((el: any) => {
          el.classList.add("lightTheme");
          el.classList.remove("darkTheme");
        });
      } else {
        console.log("Uknown mode: ", $mode);
      }
    } else {
      console.warn("No elements in ref: ", refList5);
    }

    const refList6 =
            "[ref='copyComponent'], [ref='moveComponent'], [ref='editJson']";
        const sidebarRef6 = ref.querySelectorAll(refList6);
        if (sidebarRef6.length) {
            if ($mode === "dark") {
                sidebarRef6.forEach((el: any) => {
                    el.classList.add("darkColor");
                    el.classList.remove("lightColor");
                });
            } else if ($mode === "light") {
                sidebarRef6.forEach((el: any) => {
                    el.classList.add("lightColor");
                    el.classList.remove("darkColor");
                });
            } else {
                console.log("Uknown mode: ", $mode);
            }
        } else {
            console.warn("No elements in ref: ", refList6);
        }
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
</script>

<svelte:head>
  <link rel="stylesheet" href="{base}/font-awesome/css/font-awesome.min.css" />
  <!-- For the form render -->
  <link rel="stylesheet" href="{base}/formio-dialog-content.css" />
  <!-- For  -->
  <link rel="stylesheet" href="{base}/formio.form.min.css" />
  <!-- For the drag and drop function -->
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
