<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Accordion from "$lib/components/ui/accordion";
  import Button from "$lib/components/ui/button/button.svelte";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { message } from "sveltekit-superforms";
  import { AnsiUp } from "ansi_up";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";

  const ansi = new AnsiUp();
  const { data } = $props();
  const page = "agent";
  const agent = data.item;
  let processes: any[] = $state([]);
  let packageId = $state("");
  let queuename = $state("");
  let showWarning = $state(false);
  let deleteData: any = $state({});

  async function init() {
    queuename = await auth.client.RegisterQueue(
      {
        queuename: "",
        jwt: auth.access_token,
      },
      (msg, payload, user, jwt) => {
        switch (payload.command) {
          case "listprocesses":
            processes = payload.processes;
            processes.forEach((element) => {
              element.output = "";
            });

            break;
          case "stream":
            let process = processes.find((p) => p.id == msg.correlationId);
            if (process == null) return;
            const decoder = new TextDecoder("utf-8");
            const _string = decoder.decode(
              new Uint8Array(payload.data.data as any),
            );
            process.output = _string + process.output;
            break;
          default:
            break;
        }
      },
    );
    await pokeagent();
    await listprocesses();
  }
  async function pokeagent() {
    await auth.client.QueueMessage(
      {
        data: { command: "addcommandstreamid" },
        replyto: queuename,
        queuename: agent.slug + "agent",
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
      },
      false,
    );
  }
  async function runpackage() {
    await auth.client.QueueMessage(
      {
        data: {
          command: "runpackage",
          id: packageId,
          stream: true,
          queuename: queuename,
        },
        queuename: agent.slug + "agent",
      },
      false,
    );
  }

  async function killpackage(id: string) {
    await auth.client.QueueMessage(
      {
        data: { command: "kill", id: id },
        queuename: agent.slug + "agent",
      },
      false,
    );
  }

  async function handleAccept() {
    try {
      await auth.client.QueueMessage(
        {
          data: { command: "kill", id: deleteData.id },
          queuename: agent.slug + "agent",
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
      console.error(error);
    }
  }

  if (browser) init();
</script>

<div>View Logs for packages running on {agent.name}</div>

<Entityselector
  collectionname="agents"
  basefilter={{ _type: "package", language: { $in: agent.languages } }}
  bind:value={packageId}
/>
<Button onclick={runpackage}>Run package</Button>
<br />

<Button onclick={init}>Init</Button>
<Button onclick={pokeagent}>refresh</Button>
<Button onclick={listprocesses}>List processes</Button>
{#if processes.length > 0}
  <ul>
    <Accordion.Root type="single" class="w-full sm:max-w-[70%]">
      {#each processes as process}
        <Accordion.Item value={process.id}>
          <Accordion.Trigger
            >{process.packagename}
            {process.schedulename}
            {process.id}
          </Accordion.Trigger>
          <Accordion.Content>
            <Button
              onclick={() => {
                deleteData = process;
                showWarning = true;
              }}
              variant="link">Kill process</Button
            >
            <br />
            {@html ansi.ansi_to_html(process.output).split("\n").join("<br>")}
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>

    <!-- <li>{process.packagename} {process.schedulename} {process.id}</li>
      <pre>{process.output}</pre> -->
  </ul>
{/if}

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
