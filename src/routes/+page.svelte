<script lang="ts">
    import { browser } from "$app/environment";
  import { pushState } from "$app/navigation";
  import { base } from "$app/paths";
    import { onMount } from "svelte";
  let { data } = $props();
  console.log("data", data);
  if(data.redirect == true && browser) {
    setTimeout(() => {
      pushState(base + "/", {});
    }, 500);
  }
  console.log(data);
</script>
<h1>Hello {data.name}!</h1>
<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the documentation
</p>
