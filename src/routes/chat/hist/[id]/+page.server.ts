import { goto } from "$app/navigation";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ parent }) => {
  try {
    const { access_token, id } = await parent();
    if (id == null || id == "") {
      goto("/chat");
      return { thread: null, messages: [] };
    }
    let messages = await auth.client.Query<any>({ collectionname: "llmchat", query: { threadid: id, _type: "message" }, jwt: access_token });
    messages = messages.map(x => x.message);
    messages = messages.sort((a, b) => a.index - b.index);
    let thread = await auth.client.FindOne<any>({ collectionname: "llmchat", query: { _id: id, _type: "thread" }, jwt: access_token });
    return { thread, messages };
  } catch (error) {
    console.log(error);
  }
  return { thread: null, messages: [] };
};
