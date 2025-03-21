<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput";
  import Entities from "$lib/entities/entities.svelte";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte";
    import { tick } from "svelte";
  import { string } from "zod";

  let { data } = $props();
  let queuename = $state("");
  let chatmessage = $state("");
  let llmmodel = $state("openai/gpt-3.5-turbo-1106");
  let threadid = $state(data.id);
  let mongoquery = $state({});
  let entities = $state([]);
  let total_count = $state(0);

  type message = {
    name: string;
    content: string;
    error: boolean;
    index: number;
    role: string;
    MongoQuery: string;
    MongoAggregate: string;
    pipeline: any;
    workflowid: string;
    parameters: any[];
    correlationId: string;
    robotid: string;
  };
  let messages: message[] = $state(data.messages);
  let ref: any;
  let msgLogEl: HTMLDivElement;
  let chatInput: any = null;

  async function init() {
    try {
      queuename = await auth.client.RegisterQueue(
        {
          queuename: "",
          jwt: auth.access_token,
        },
        async (msg, payload, user, jwt) => {
          if (payload.threadid != null && payload.threadid != "") {
            threadid = payload.threadid;
          }
          if (
            messages.find((m) => m.correlationId == msg.correlationId) != null
          ) {
            let pre = document.getElementById(msg.correlationId);
            if (pre != null) {
              if (payload.command == "timeout") {
                pre.innerText =
                  payload.command + " is robot running?\n" + pre.innerText;
              } else {
                if (payload.data == null) payload.data = {};
                if (Object.keys(payload.data).length == 0) {
                  pre.innerText = payload.command + "\n" + pre.innerText;
                } else {
                  pre.innerText =
                    payload.command +
                    " " +
                    JSON.stringify(payload.data) +
                    "\n" +
                    pre.innerText;
                }
              }
            } else {
              console.error("pre " + msg.correlationId + " is null", payload);
            }
            return;
          }
          // if (payload.error != null && payload.error != "") {
          //   console.error("error", payload.error);
          // } else
          if (payload.func == "message" || payload.func == "tool") {
            messages.push(payload.message);
            messages = messages.sort((a, b) => a.index - b.index);
          }
          if(msgLogEl != null) {
            await tick();
            msgLogEl.scroll(0,msgLogEl.scrollHeight+50);
            setTimeout(() => {
              msgLogEl.scroll(0,msgLogEl.scrollHeight+50);
              // window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'smooth'})
            }, 200)
          }
        },
      );
      await tick();
      msgLogEl.scroll(0,msgLogEl.scrollHeight+50);
      setTimeout(() => {
        msgLogEl.scroll(0,msgLogEl.scrollHeight+50);
        // window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'smooth'})
        }, 200)

    } catch (error) {
      console.error("error", error);
    }
  }
  if(browser) init();
</script>

<div bind:this={msgLogEl} class="h-[calc(100vh-4rem)] overflow-y-auto min-h-80">
{#each messages as msg}
  <div class="mb-4">
    {#if msg.role == "assistant"}
      <div class="font-bold">Assistant</div>
      <div>{msg.content}</div>
    {:else if msg.role == "user"}
      <div class="font-bold">User</div>
      <div>{msg.content}</div>
    {:else if msg.role == "tool"}
      <div class="font-bold">Tool</div>
      <HotkeyButton
        class="mb-4"
        aria-label={msg.name}
        type="submit"
        onclick={async () => {
          try {
            if (msg.name == "RunOpenRPAWorkflow") {
              const rpacommand = {
                command: "invoke",
                workflowid: msg.workflowid,
                data: msg.parameters,
              };
              await auth.client.QueueMessage({
                correlationId: msg.correlationId,
                data: rpacommand,
                queuename: msg.robotid,
                replyto: queuename,
                jwt: auth.access_token,
              });

              return;
            }
            let _entities = JSON.parse(msg.content);
            total_count = entities.length;
            entities = _entities;
            if (msg.MongoQuery != null) {
              mongoquery = JSON.parse(msg.MongoQuery);
            } else if (msg.MongoAggregate != null) {
              mongoquery = JSON.parse(msg.MongoAggregate);
            } else if (msg.pipeline != null) {
              mongoquery = msg.pipeline;
            } else {
              console.debug("msg", msg);
            }
            ref.AutoDetectColumns();
          } catch (error) {
            console.error(error);
          }
        }}>{msg.name}</HotkeyButton
      >
      <pre id={msg.correlationId}></pre>
    {/if}
  </div>
{/each}
</div>
<form class="flex items-center space-x-2 mb-4">
  
  <CustomInput bind:value={chatmessage} bind:this={chatInput} label="Chat message" />
  <HotkeyButton
    class=""
    aria-label="Send"
    type="submit"
    onclick={async () => {
      var payload = {
        func: "chat",
        model: $state.snapshot(llmmodel),
        // model: "ollama/mistral",
        // model: "ollama/functionary",
        message: $state.snapshot(chatmessage),
        threadid: $state.snapshot(threadid),
        // json: true,
      };
      try {
        setTimeout(() => {
          chatInput.focus();
        }, 100);
        chatInput.focus();
        const result: any = await auth.client.QueueMessage({
          queuename: auth.config.llmchat_queue,
          replyto: $state.snapshot(queuename),
          data: payload,
          jwt: auth.access_token,
        });
        chatmessage = "";
      } catch (error) {
        console.error(error);
      }
    }}>Send</HotkeyButton
  >
  <HotkeyButton
  class=""
  aria-label="Old chat threads"
  type="button"
  onclick={async () => {
    goto(base + "/chat/hist");
  }}>Old chat threads</HotkeyButton
>
</form>
<ObjectInput bind:value={mongoquery} label="Mongo query or pipeline" height="h-14" />
<Entities
  bind:entities
  collectionname="customcommand"
  multi_select={false}
  show_delete={false}
  {total_count}
  bind:this={ref}
/>
