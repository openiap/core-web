<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  const { data } = $props();
  // @ts-ignore
  let { collectionname } = data;
  if (browser) {
    if (collectionname != null && collectionname != "") {
      goto(base + "/entities/" + collectionname);
    } else {
      goto(base + "/entities/entities");
    }
  }
</script>

Redirecting you to {collectionname}...
