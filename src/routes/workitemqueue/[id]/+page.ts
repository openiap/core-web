import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "mq", query: { _id: params.id, _type: "workitemqueue" }, jwt: access_token });

    let agentdata = {}, amqpqueuedata = {};

    async function setAmqpQueueData() {
      amqpqueuedata = await auth.client.FindOne<any>({
        collectionname: "mq",
        query: { name: item.amqpqueue, _type: "queue" },
        projection: { name: 1, _type: 1 },
        jwt: auth.access_token,
      });
      console.log(amqpqueuedata);
    }

    if (item.amqpqueue) {
      if (item.amqpqueue.endsWith("agent")) {
        let slug = item.amqpqueue.replace("agent", "");
        let FindOneRes = await auth.client.FindOne<any>({
          collectionname: "agents",
          query: { slug },
          projection: { slug: 1, name: 1, _type: 1 },
          jwt: auth.access_token,
        });
        if (!FindOneRes) {
          await setAmqpQueueData();
        } else {
          agentdata = FindOneRes
          console.log(agentdata);
        }
      } else {
        await setAmqpQueueData()
      }
    }

    return { item, agentdata, amqpqueuedata };
  } catch (error) {
    return { item: null };
  }
};
