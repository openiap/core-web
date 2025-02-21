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
        // const refList6 = "[ref='datagrid-dataGrid-removeRow']";
        // const sidebarRef6 = ref.querySelectorAll(refList6);
        // if (sidebarRef6.length) {
        //     if ($mode === "dark") {
        //         sidebarRef6.forEach((el: any) => {
        //             el.classList.add("lightDeleteButton");
        //             el.classList.remove("lightThemeButton");
        //         });
        //     } else if ($mode === "light") {
        //         sidebarRef6.forEach((el: any) => {
        //             el.classList.add("lightDeleteButton");
        //             el.classList.remove("darkThemeButton");
        //         });
        //     } else {
        //         console.log("Uknown mode: ", $mode);
        //     }
        // } else {
        //     console.warn("No elements in ref: ", refList6);
        // }

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
    }
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
                console.log("updateComponent", component);
                updateStyle();
            });
            // builder.on("addComponent", (component: any) => {
            //     console.log("addComponent", component);
            // });
            // builder.on("editComponent", (component: any) => {
            //     console.log("editComponent", component);
            // });
        } catch (e) {
            console.log(e);
        }
        loading = false;
    }
    let firstrun = $state(true);
    if (browser) {
        $effect(() => {
            if (
                ref != null &&
                data.item.schema.components.length > 0 &&
                firstrun == true
            ) {
                console.log("calling createfrom()");
                createfrom();
                firstrun = false;
            }
            updateStyle();
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
    <div class="flex items-center justify-start space-x-4 mb-4">
        {#if data && data.item && data.item.name}
            <CustomInput
                class="max-w-sm"
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
