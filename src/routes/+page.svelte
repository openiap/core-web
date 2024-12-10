<script lang="ts">
  import { browser } from "$app/environment";
  import { pushState } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import { onMount } from "svelte";
  import SuperDebug from "sveltekit-superforms";
  let { data } = $props();
  if (data.redirect == true && browser) {
    setTimeout(() => {
      pushState(base + "/", {});
    }, 500);
  }
  let user = $state({
  "_id": "6751a3af97d90bf53cbd3a12",
  "name": "resttest",
  "_version": 0,
  "_createdby": "Allan Zimmermann",
  "_createdbyid": "5ce9422d320b9c09742c3ced",
  "_created": "2024-12-05T12:59:26.993Z",
  "_modifiedby": "Allan Zimmermann",
  "_modifiedbyid": "5ce9422d320b9c09742c3ced",
  "_modified": "2024-12-05T12:59:26.993Z",
  "_type": "unknown",
  "_acl": [
    {
      "rights": 65535,
      "_id": "5a1702fa245d9013697656fb",
      "name": "admins",
      "$$hashKey": "object:262"
    }
  ],
  "_encrypt": []
});
</script>

<Acl bind:value={user} />

<br />
<SuperDebug data={user} theme="vscode" />


<h1>Hello {data.name}!</h1>

<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the documentation
</p>

