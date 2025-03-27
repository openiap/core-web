<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput";
  import Entities from "$lib/entities/entities.svelte";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  import {
    ArrowRight,
    ArrowUp,
    CircleHelp,
    History,
    Info,
    Maximize2,
  } from "lucide-svelte";
  import { tick } from "svelte";
  import { toast } from "svelte-sonner";

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
    query: string;
  };

  let { data } = $props();
  let queuename = $state("");
  let chatmessage = $state("");
  let llmmodel = $state("openai/gpt-3.5-turbo-1106");
  let threadid = $state(data.id);
  let messages: message[] = $state(data.messages);
  let mongoquery = $state({});
  let entities = $state([]);
  let total_count = $state(0);
  // svelte-ignore non_reactive_update
  let ref: any;
  // svelte-ignore non_reactive_update
  let msgLogEl: HTMLDivElement;
  // svelte-ignore non_reactive_update
  let chatInput: any = null;

  let showChat: boolean = $state(true);
  let showQuery: boolean = $state(false);
  let showTable: boolean = $state(false);

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
          if (msgLogEl != null) {
            await tick();
            msgLogEl.scroll(0, msgLogEl.scrollHeight + 50);
            setTimeout(() => {
              msgLogEl.scroll(0, msgLogEl.scrollHeight + 50);
              // window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'smooth'})
            }, 200);
          }
        },
      );
      await tick();
      msgLogEl.scroll(0, msgLogEl.scrollHeight + 50);
      setTimeout(() => {
        msgLogEl.scroll(0, msgLogEl.scrollHeight + 50);
        // window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'smooth'})
      }, 200);
    } catch (error: any) {
      toast.error("Error initializing chat", {
        description: error.message,
      });
    }
  }
  if (browser) init();

  const starterQuestions = [
    "Find the email of user named %username%",
    "What are the last 20 audit entries ?",
    "List the number of audit entries grouped by month",
    "Get the top 20 OpenRPA workflows grouped by created user",
    "What is the top 10 most run openrpa workflow grouped by name?",
    // "What is the top 10 most run openrpa workflow grouped by name, and then write a short story about OpenRPA the happy robot",
  ];

  function renderIcon() {
    if (entities.length == 0) return false;
    else return true;
  }
  async function sendChat() {
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
    } catch (error: any) {
      toast.error("Error sending message", {
        description: error.message,
      });
    }
  }
  $effect(() => {
    chatInput.focus();
  });
</script>

<div class="mb-6">
  {#if renderIcon()}
    <div class="flex items-center space-x-3 mb-3">
      <HotkeyButton
        class="bg-bw700 hover:bg-bw600 dark:bg-bw600 dark:hover:bg-bw500 p-1 rounded-[5px]"
        variant="ghostfull"
        size="ghost"
        onclick={() => (showChat = !showChat)}
      >
        <Maximize2 class="h-4 w-4 text-bw100" />
      </HotkeyButton>
      <p>Chat</p>
    </div>
  {/if}
  {#if showChat == true}
    <div
      bind:this={msgLogEl}
      class=" overflow-y-auto min-h-80 bg-bw200 dark:bg-bw850 border rounded-[10px] dark:border-bw600 mb-4 text-[14px] font-normal"
    >
      {#if messages.length == 0}
        <div
          class="mb-4 bg-[#BEBEBE] border-[#86888E] dark:bg-[#52565B] m-2 p-2 rounded-[10px] flex items-center space-x-5 w-fit lg:max-w-[calc(100%-10rem)]"
        >
          <div class="ms-3">
            <Info class="h-4 w-4" />
          </div>
          <p>
            Ask about data within OpenCore or trigger OpenRPA workflows for
            connected robots. Use the buttons below for example conversation
            starters. If the robot doesn’t respond correctly, try resetting the
            conversation with the reset button and ask again.
          </p>
        </div>
      {/if}
      {#each messages as msg}
        {#if msg.role == "tool"}
          <div class="mb-4 chat-container p-2.5">
            <div class={`justify-start`}>
              <div
                class={"p-3 rounded-[10px] max-w-[75%] bg-[#BEBEBE] dark:bg-[#373A3F] text-bw950 dark:text-bw100 rounded-bl-none " +
                  msg.role}
              >
                <HotkeyButton
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
                      if (msg.name == "GetCollections") {
                        entities = entities.map((e: any) => {
                          return { name: e };
                        }) as any;
                      } else if (msg.MongoQuery != null) {
                        mongoquery = JSON.parse(msg.MongoQuery);
                      } else if (msg.MongoAggregate != null) {
                        mongoquery = JSON.parse(msg.MongoAggregate);
                      } else if (msg.pipeline != null) {
                        mongoquery = msg.pipeline;
                      } else if (msg.query != null) {
                        mongoquery = msg.query;
                      } else {
                        console.debug("msg", msg);
                      }
                      showQuery = true;
                      await tick();
                      if (entities.length > 0) {
                        showTable = true;
                        await tick();
                        ref.AutoDetectColumns();
                      } else {
                      }
                    } catch (error: any) {
                      toast.error("Error sending message", {
                        description: error.message,
                      });
                    }
                  }}
                >
                  <ArrowRight class="h-4 w-4" />
                  {msg.name}</HotkeyButton
                >
                <pre id={msg.correlationId}></pre>
              </div>
            </div>
          </div>
        {:else if msg.content != null && msg.content != ""}
          <div class="mb-4 chat-container p-2.5">
            <div
              class={` ${msg.role === "user" ? "flex justify-end" : "justify-start"}`}
            >
              <div
                class={`p-3 rounded-[10px] max-w-[75%] ${msg.role} ${
                  msg.role === "user"
                    ? "bg-[#AFAFAF] dark:bg-[#52565B] text-bw950 dark:text-bw100 rounded-br-none"
                    : "bg-[#BEBEBE] dark:bg-[#373A3F] text-bw950 dark:text-bw100 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </div>
    <div class="flex justify-center">
      <form
        class="flex flex-col items-center space-x-2 mb-4 p-5 border border-bw600 rounded-[10px] dark:boder-bw600 bg-bw200 dark:bg-bw900 w-[700px]"
      >
        <CustomInput
          bind:value={chatmessage}
          bind:this={chatInput}
          placeholder="Chat with OpenCore about your data or tell it to do something with your data "
          width="w-full"
          class="mb-4 border-hidden bg-bw200 dark:bg-bw900"
        />
        <div class="flex w-full items-center justify-between space-x-2">
          <div class="flex space-x-5">
            <HotkeyButton
              class="dark:text-bw400"
              aria-label="New conversation"
              type="button"
              onclick={async () => {
                if (data.id == null || data.id == "") return location.reload();
                goto(base + "/chat");
              }}
            >
              <History />
              New conversation</HotkeyButton
            >
            <HotkeyButton
              class="dark:text-bw400"
              aria-label="Old chat threads"
              type="button"
              onclick={async () => {
                goto(base + "/chat/hist");
              }}
            >
              <History />
              History</HotkeyButton
            >
          </div>
          <HotkeyButton
            class=""
            variant="sendchat"
            size="sendchat"
            aria-label="Send"
            type="submit"
            onclick={async () => {
              if (chatmessage == "")
                return toast.error("Please enter a message");
              await sendChat();
            }}><ArrowUp class="h-4 w-4" /></HotkeyButton
          >
        </div>
      </form>
    </div>
  {/if}
</div>

{#if messages.length == 0}
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
    {#each starterQuestions as question}
      <div class="mb-2">
        <HotkeyButton
          class="dark:text-bw400"
          aria-label="Old chat threads"
          type="button"
          onclick={async () => {
            chatmessage = question.replace(
              "%username%",
              auth.profile?.name ?? "anything",
            );
            sendChat();
          }}
        >
          <CircleHelp class="h-4 w-4" />
          {question.replace("%username%", auth.profile?.name ?? "anything")}
        </HotkeyButton>
      </div>
    {/each}
  </div>
{/if}

{#if messages.length > 0}
  <div class="mb-6">
    <div class="flex items-center space-x-3 mb-3">
      <HotkeyButton
        class="bg-bw600 p-1 rounded-[5px]"
        variant="ghostfull"
        size="ghost"
        onclick={() => (showQuery = !showQuery)}
      >
        <Maximize2 class="h-4 w-4 text-bw100" />
      </HotkeyButton>
      <p>MongoQuery / Workflow</p>
    </div>
    {#if showQuery}
      <ObjectInput
        bind:value={mongoquery}
        label="Mongo query or pipeline"
        height="h-14"
        classname="mb-4"
      />
    {/if}
  </div>

  <div>
    <div class="flex items-center space-x-3 mb-3">
      <HotkeyButton
        class="bg-bw600 p-1 rounded-[5px]"
        variant="ghostfull"
        size="ghost"
        onclick={() => (showTable = !showTable)}
      >
        <Maximize2 class="h-4 w-4 text-bw100" />
      </HotkeyButton>
      <p>Data</p>
    </div>
    {#if showTable}
      <Entities
        bind:entities
        collectionname="customcommand"
        multi_select={false}
        show_delete={false}
        {total_count}
        bind:this={ref}
      />
    {:else if showQuery == true}
      <div>No data found</div>
    {/if}
  </div>
{/if}
