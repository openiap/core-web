import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();

  let collectionname = params.collection;
  const aggregates = [
    { $group: { _id: { _type: "$_type" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]

  try {
    const entities = await auth.client.Aggregate<any>({ collectionname, aggregates, jwt: access_token });
    const collections = await auth.client.ListCollections({ jwt: access_token });
    return { collections, collectionname, entities };
  } catch (error) {
    return { collections: [], collectionname, entities: [] };
  }
};
