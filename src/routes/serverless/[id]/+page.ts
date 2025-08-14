import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "sf", query: { _id: params.id, _type: "app" }, jwt: access_token });

    let chartdata
    // let aggdata = await auth.client.Aggregate<any>({
    //   collectionname: "sf_instance_logs", aggregates: [
    //     {
    //       $match: { "metadata.package": item.repo + ":" + item.tag }
    //     },
    //     {
    //       $project: {
    //         ts_epoch: { $toLong: { $toDate: "$ts" } }, // ms epoch
    //         run_time_sec: { $divide: ["$run_time", 1000] }
    //       }
    //     },
    //     {
    //       $project: {
    //         ts_epoch: { $divide: ["$ts_epoch", 1000] }, // convert ms → seconds
    //         run_time_sec: 1
    //       }
    //     },
    //     {
    //       $group: {
    //         _id: null,
    //         ts_array: { $push: "$ts_epoch" },
    //         run_time_array: { $push: "$run_time_sec" }
    //       }
    //     },
    //     {
    //       $project: {
    //         _id: 0,
    //         arrays: ["$ts_array", "$run_time_array"]
    //       }
    //     }
    //   ], jwt: access_token
    // });
    // console.log("aggdata", aggdata);
    // if (aggdata.length > 0) {
    //   console.log(aggdata[0]);
    //   console.log(aggdata[0].arrays[0]);
    //   console.log(aggdata[0].arrays[1]);
    //   chartdata = aggdata[0];
    //   chartdata = [new Float64Array(aggdata[0].arrays[0]), new Float64Array(aggdata[0].arrays[1])];
    //   console.log("chartdata", chartdata);
    // }

    return { item, chartdata };
  } catch (error) {
    return { item: null, chartdata: null };
  }
};
