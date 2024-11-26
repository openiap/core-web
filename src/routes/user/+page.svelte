<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  let users: any[] = $state([]);
  // (()={
  // })()
  async function load(){
    users = await auth.client.Query<any>({
      collectionname: "users",
      query: { _type: "user" },
    });
    console.log($state.snapshot(users));
  }
  load();
</script>

<svelte:head>
  <title>Users</title>
  <meta
    name="description"
    content="Get performance data and generates index suggestions for better database performance"
  />
</svelte:head>
{#each users as user}
  <p>{user.name}</p>
{/each}
