<svelte:head>
	<title>Users</title>
	<meta name="description" content="Get performance data and generates index suggestions for better database performance" />
</svelte:head>
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { fetchUsers } from "$lib/hooks/test.svelte";
  
  import { auth } from "$lib/stores/auth.svelte";

  let users:any[] = $state([]);

  auth.onLogin(async () => {
      users = await auth.client.Query<any>({ collectionname: "users", query: {"_type": "user"} });
      console.log($state.snapshot(users));
  });

//   $effect(() => {
//   auth.ensureClient();

//   // auth.client?.Query<any>({ collectionname: "users", query: {"_type": "user"} }).then(results => {
//   //   sync.users = results;
//   // });
// });

</script>
{#each users as user}
  <p>{user.name}</p>
{/each}
