<script lang="ts">
  import { base } from "$app/paths";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import cSvg from "$lib/images/svgs/C_Programming_Language.svg";
  import dotnetSvg from "$lib/images/svgs/dotnet.svg";
  import javaSvg from "$lib/images/svgs/java.svg";
  import javalightSvg from "$lib/images/svgs/java_lightmode.svg";
  import jsSvg from "$lib/images/svgs/js.svg";
  import openiapSvg from "$lib/images/svgs/openiap.svg";
  import phpSvg from "$lib/images/svgs/php.svg";
  import pythonSvg from "$lib/images/svgs/python.svg";
  import rustSvg from "$lib/images/svgs/rust.svg";
  import rustlightSvg from "$lib/images/svgs/rust_lightmode.svg";
  import vscodeSvg from "$lib/images/svgs/vscode.svg";
  import browerSvg from "$lib/images/svgs/web.svg";
  import { auth } from "$lib/stores/auth.svelte";

  let name = $derived(() => auth.profile?.name || "World");
  const { data } = $props();
  // Helper function to map state to valid badge variant
  function getBadgeVariant(
    state: string,
  ): "default" | "secondary" | "destructive" | "outline" | undefined {
    if (state == null) return "default";
    switch (state.toLowerCase()) {
      case "pending":
        return "secondary";
      case "error":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "default";
    }
  }
  const clientlibraries = [
    {
      title: "NodeJS",
      logo: jsSvg,
      logolight: jsSvg,
      buttons: {
        example: "https://github.com/skadefro/nodetest",
        package: {
          title: "npm",
          link: "https://www.npmjs.com/package/openiap",
        },
      },
    },
    {
      title: "Rust",
      logo: rustSvg,
      logolight: rustlightSvg,
      buttons: {
        example: "https://github.com/openiap/rustapi/tree/main/crates/cli",
        package: {
          title: "crates.io",
          link: "https://crates.io/crates/openiap-client",
        },
      },
    },
    {
      title: "C/C++",
      logo: cSvg,
      logolight: cSvg,
      buttons: {
        example: "https://github.com/skadefro/ctest",
        package: {
          title: "make",
          link: "https://raw.githubusercontent.com/openiap/rustapi/refs/heads/main/c/Makefile",
        },
      },
    },
    {
      title: "Python",
      logo: pythonSvg,
      logolight: pythonSvg,
      buttons: {
        example: "https://github.com/skadefro/pythontest",
        package: {
          title: "pyip",
          link: "https://pypi.org/project/openiap-edge/",
        },
      },
    },
    {
      title: ".NET",
      logo: dotnetSvg,
      logolight: dotnetSvg,
      buttons: {
        example: "https://github.com/skadefro/dotnettest",
        package: {
          title: "nuget",
          link: "https://www.nuget.org/packages/openiap/",
        },
      },
    },
    {
      title: "Java",
      logo: javaSvg,
      logolight: javalightSvg,
      buttons: {
        example: "https://github.com/skadefro/javatest",
        package: {
          title: "maven",
          link: "https://central.sonatype.com/artifact/io.openiap/client",
        },
      },
    },
    {
      title: "PHP",
      logo: phpSvg,
      logolight: phpSvg,
      buttons: {
        example: "https://github.com/skadefro/phptest",
        package: {
          title: "packagist",
          link: "https://packagist.org/packages/openiap/client/",
        },
      },
    },
    {
      title: "Browser",
      logo: browerSvg,
      logolight: browerSvg,
      buttons: {
        example: "https://github.com/openiap/core-web",
        package: {
          title: "esm",
          link: "https://www.npmjs.com/package/@openiap/jsapi",
        },
      },
    },
  ];
  const cardRoot = "text-sm bg-bw200 dark:bg-bw900 rounded-[10px] p-5";
</script>

{#if (!data.entities || data.entities.length == 0) && (auth.config?.web_hide_general_info == null || auth.config?.web_hide_general_info == false)}
  <div class="mb-5 font-bold text-lg">Need Help?</div>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
    <div class={cardRoot}>
      <div class="flex flex-col justify-between h-full">
        <div>
          <div class="mb-2 dark:text-bw50">Documentation</div>
          <div class="mb-5 dark:text-bw400">
            If you’re looking for in-depth knowledge, our full documentation is
            available here:
          </div>
        </div>
        <div>
          <HotkeyButton
            aria-label={"Goto Documentation"}
            size="sm"
            onclick={() => window.open("https://docs.openiap.io/", "_blank")}
            >Documentation</HotkeyButton
          >
          <!-- <a
            href="https://docs.openiap.io/"
            class="dark:text-buttonlink"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://docs.openiap.io/
          </a> -->
        </div>
      </div>
    </div>

    <div class={cardRoot}>
      <div class="flex flex-col justify-between h-full">
        <div>
          <div class="mb-2 dark:text-bw50">Community Forum</div>
          <div class="mb-5 dark:text-bw400">
            Have questions? Ask away in our community forum or explore similar
            discussions for inspiration:
          </div>
        </div>
        <div>
          <HotkeyButton
            aria-label={"Goto the community forum"}
            size="sm"
            onclick={() =>
              window.open("https://discourse.openiap.io/", "_blank")}
            >Community Forum</HotkeyButton
          >
          <!-- <a
            href="https://discourse.openiap.io/"
            class="dark:text-buttonlink"
            target="_blank"
            rel="noopener noreferrer">https://discourse.openiap.io/</a
          > -->
        </div>
      </div>
    </div>
  </div>

  <div class="mt-3 mb-5 font-bold text-lg">Client Libraries</div>
  <div class={cardRoot + " mb-10"}>
    <div
      class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-11 rounded-[10px]"
    >
      {#each clientlibraries as item}
        <div class="flex flex-col items-start space-y-2">
          <div class="flex shrink-0 items-center space-x-2">
            <img src={item?.logo} alt={item?.title + " logo"} class="h-6 w-6" />
            <!-- {#if $mode != null || undefined}
              <img
                src={$mode == "light" ? item?.logolight : item?.logo}
                alt={item?.title + " logo"}
                class="h-6 w-6"
              />
            {/if} -->
            <div>{item?.title}</div>
          </div>
          <div class="flex flex-col space-y-4">
            <div
              class="flex flex-row space-x-2.5 space-y-0 items-center sm:space-x-0 sm:flex-col sm:space-y-2.5 lg:space-y-0 lg:flex-row lg:space-x-2.5"
            >
              {#if item?.buttons?.package?.link}
                <HotkeyButton
                  aria-label={"Goto " + item?.buttons?.package?.title}
                  size="sm"
                  onclick={() =>
                    window.open(item?.buttons?.package?.link, "_blank")}
                  >{item?.buttons?.package?.title}</HotkeyButton
                >
              {/if}
              <HotkeyButton
                aria-label={"Goto " + item?.title + " example"}
                size="sm"
                onclick={() => window.open(item?.buttons?.example, "_blank")}
                >Example</HotkeyButton
              >
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="mt-3 mb-5 font-bold text-lg">Set-Up</div>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
    <div class={cardRoot}>
      <div class="flex flex-col justify-between h-full">
        <div>
          <div class="mb-2 dark:text-bw50">
            Get started with our VSC extension
          </div>
          <div class="mb-5 dark:text-bw400">
            Our VS Code extension, makes it easier to get started by helping you
            manage your .env files efficiently. Download the extension here:
          </div>
        </div>
        <div>
          <HotkeyButton
            aria-label="Download VSC extension"
            onclick={() =>
              // window.open(
              //   "vscode:extension/openiap.openiap-assistant",
              //   "_blank",
              // )}
              window.open(
                "https://marketplace.visualstudio.com/items?itemName=openiap.openiap-assistant",
                "_blank",
              )}
          >
            <img src={vscodeSvg} alt="VS Code" class="h-4 w-4" />
            Download VSC extension
          </HotkeyButton>
        </div>
      </div>
    </div>
    <div class={cardRoot}>
      <div class="flex flex-col justify-between h-full">
        <div>
          <div class="mb-2 dark:text-bw50">Download OpenRPA</div>
          <div class="mb-5 dark:text-bw400">
            If you are looking for a free and open source Robotic Process
            Automation tool, we also maintain OpenRPA that you can easily manage
            from OpenCore:
          </div>
        </div>
        <div>
          <HotkeyButton
            aria-label="Download OpenRPA"
            onclick={() =>
              window.open(
                "https://github.com/open-rpa/openrpa/releases/latest/download/OpenRPA.msi",
                "_blank",
              )}
          >
            <img src={openiapSvg} alt="OpenIAP" class="h-4 w-4" />
            Download OpenRPA</HotkeyButton
          >
        </div>
      </div>
    </div>
  </div>
{:else if !data.entities || data.entities.length == 0}
  <div class="container mx-auto p-4 space-y-4">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card.Root class="hover:shadow-lg transition-shadow">
        <Card.Header>
          <Card.Title class="flex items-center justify-between">
            <span>No pending tasks</span>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="text-sm dark:text-bw400">
            There are no new or pending tasks waiting for input.
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
{:else}
  <div class="container mx-auto p-4 space-y-4">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.entities as task}
        <Card.Root class="hover:shadow-lg transition-shadow">
          <Card.Header>
            <Card.Title class="flex items-center justify-between">
              <span>{task.name}</span>
              <Badge variant={getBadgeVariant(task.state)}>
                {task.state}
              </Badge>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <Button
              variant="outline"
              class="w-full"
              href={`${base}/formworkflow/${task._id}`}
            >
              Open Task
            </Button>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
    <div>
      <CustomSuperDebug formData={data.entities} />
    </div>
  </div>
{/if}
