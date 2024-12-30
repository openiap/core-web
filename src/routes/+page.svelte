<script lang="ts">
  import { browser } from "$app/environment";
  import { base } from "$app/paths";
  let { data } = $props();
  if (data.redirect == true && browser) {
    setTimeout(() => {
      window.location.href = base + "/";
    }, 500);
  }
</script>
<h1>Hello {data.name}!</h1>
<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the documentation
</p>

