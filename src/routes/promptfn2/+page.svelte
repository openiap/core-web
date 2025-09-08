<script lang="ts">
  import { base } from "$app/paths";

  let input = "";
  let output = "";
  let abort: AbortController | null = null;

  async function send() {
    output = "";
    abort?.abort();
    abort = new AbortController();

    const res = await fetch(base + "/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: input }] }),
      headers: { "content-type": "application/json" },
      signal: abort.signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      output += decoder.decode(value, { stream: true });
    }
  }
</script>

<form on:submit|preventDefault={send} class="stack">
  <textarea bind:value={input} rows="4"></textarea>
  <button>Send</button>
</form>

<pre>{output}</pre>
