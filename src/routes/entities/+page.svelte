<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  const { data } = $props();
  // @ts-ignore
  let { collectionname } = data;
  if(collectionname != null && collectionname != "") {
    goto(base + "/entities/" + collectionname);
  } else {
    goto(base + "/entities/entities");
  }
</script>

If you can see this, something is wrong
