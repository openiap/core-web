<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
    import { CustomInput } from "$lib/custominput";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { Formio } from "formiojs";
    import { Check } from "lucide-svelte";
    import { mode } from "mode-watcher";
    import { onDestroy } from "svelte";
    import { toast } from "svelte-sonner";

    const { data } = $props();

    let builder: any = null as any;
    let ref = $state(null) as any;
    let message = $state("");
    let loading = $state(false);
    let _mode = $state.snapshot($mode);

    function updateStyle() {
        const refList1 =
            "input, select, textarea, div.card, div.dropdown, li.list-group-item, li.list-group-header, div.choices__inner, div.input-group-text, input.form-control, list-group-item";
        const sidebarRef1 = ref.querySelectorAll(refList1);
        if (sidebarRef1.length) {
            if ($mode === "dark") {
                sidebarRef1.forEach((el: any) => {
                    el.classList.add("darkTheme");
                    el.classList.remove("lightTheme");
                    el.classList.remove("bg-light");
                });
            } else if ($mode === "light") {
                sidebarRef1.forEach((el: any) => {
                    el.classList.add("lightTheme");
                    el.classList.remove("darkTheme");
                });
            }
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
            }
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
            }
        }

        const refList4 = "div.form-builder-panel";
        const sidebarRef4 = ref.querySelectorAll(refList4);
        if (sidebarRef4.length) {
            sidebarRef4.forEach((el: any) => {
                el.classList.add("themeMargin");
            });
        }

        const refList5 = "table";
        const sidebarRef5 = ref.querySelectorAll(refList5);
        if (sidebarRef5.length) {
            if ($mode === "dark") {
                sidebarRef5.forEach((el: any) => {
                    el.classList.add("darkTheme");
                    el.classList.remove("lightTheme");
                    el.classList.remove("bg-light");
                });
            } else if ($mode === "light") {
                sidebarRef5.forEach((el: any) => {
                    el.classList.add("lightTheme");
                    el.classList.remove("darkTheme");
                });
            }
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
            }
        }
    }
    async function createfrom() {
        loading = true;
        try {
            // @ts-ignore
            if (Formio == null || typeof Formio.builder !== "function") {
                setTimeout(async () => {
                    createfrom();
                }, 200);
                return;
            }
        } catch (error) {
            setTimeout(async () => {
                createfrom();
            }, 200);
            return;
        }

        try {
            // builder = await Formio.createForm(ref, data.item.schema, {
            // @ts-ignore
            builder = await Formio.builder(ref, data.item.schema, {
                builder: {
                    data: {
                        display: "form",
                        components: [],
                    },
                },
            });
            updateStyle();
            builder.on("updateComponent", (component: any) => {
                updateStyle();
            });
        } catch (e) {}
        loading = false;
    }
    let firstrun = $state(true);
    if (browser) {
        $effect(() => {
            if (_mode != $mode) {
                _mode = $mode;
                updateStyle();
            }
            if (
                ref != null &&
                data.item.schema.components.length > 0 &&
                firstrun == true
            ) {
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
        if (data.item.name == "") {
            message = "Please enter form name";
            return;
        }
        // @ts-ignore
        data.item.components = builder.schema;

        try {
            const result = await auth.client.UpdateOne({
                collectionname: "forms",
                item: { ...data.item, _type: "form" },
                jwt: auth.access_token,
            });
            toast.success("Form updated");
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
    <link
        rel="stylesheet"
        href="{base}/font-awesome/css/font-awesome.min.css"
    />
    <link rel="stylesheet" href="{base}/formio-dialog-content.css" />
    <link rel="stylesheet" href="{base}/formio.form.min.css" />
    <link rel="stylesheet" href="{base}/formio.builder.min.css" />
</svelte:head>

<div>
    {message}
</div>
<div>
    <div class="md:flex md:items-center md:justify-start md:space-x-5 mb-10">
        {#if data && data.item && data.item.name}
            <CustomInput
                class="mb-4 md:mb-0 xl:max-w-sm"
                type="text"
                placeholder="Enter form name"
                bind:value={data.item.name}
            />
        {/if}
        <HotkeyButton
            onclick={saveform}
            variant="success"
            size="base"
            disabled={loading}
            aria-label="Update form"
            type="submit"
            data-shortcut="ctrl+s"
        >
            <Check />
            Update form</HotkeyButton
        >
    </div>
    <div
        class="bootstrap-scope formio-dialog-content dark:bg-bw1000"
        bind:this={ref}
    ></div>
</div>
