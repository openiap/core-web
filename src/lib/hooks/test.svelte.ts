import { auth } from "$lib/stores/auth.svelte";
export const fetchUsers = () => {
    return auth.client?.Query<any>({ collectionname: "users", query: {"_type": "user"} })
}