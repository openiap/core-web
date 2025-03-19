<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput";
  import { auth } from "$lib/stores/auth.svelte";

  let queuename = $state("");
  let chatmessage = $state("");
  let llmmodel = $state("openai/gpt-3.5-turbo-1106");
  let threadid = $state("");
  let messages = $state([
    {
      content:
        "No openaikey set on customer object, and default OPENAI API KEY was not set",
      error: true,
      index: 1,
      role: "assistant",
    },
  ]);

  async function init() {
    try {
      messages = [];
      queuename = await auth.client.RegisterQueue(
        {
          queuename: "",
          jwt: auth.access_token,
        },
        (msg, payload, user, jwt) => {
          if (payload.threadid != null && payload.threadid != "") {
            threadid = payload.threadid;
            goto(base + `/chat/hist/${threadid}`);
          }
        },
      );
    } catch (error) {
      console.error("error", error);
    }
  }
  init();
</script>

{#each messages as msg}
  <div class="mb-4">
    {#if msg.role == "assistant"}
      <div class="font-bold">Assistant</div>
    {:else}
      <div class="font-bold">User</div>
    {/if}
    <div>{msg.content}</div>
  </div>  
{/each}

<HotkeyButton
  class="mb-4"
  aria-label="Show history"
  onclick={() => goto(base + `/chat/hist`)}
>
  Show history
</HotkeyButton>
<form>
  <CustomInput bind:value={chatmessage} label="Chat message" />
  <HotkeyButton
    class="mb-4"
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
        const result: any = await auth.client.QueueMessage({
          queuename: auth.config.llmchat_queue,
          replyto: $state.snapshot(queuename),
          data: payload,
        });
      } catch (error) {
        console.error(error);
      }
    }}>Send</HotkeyButton
  >
</form>
