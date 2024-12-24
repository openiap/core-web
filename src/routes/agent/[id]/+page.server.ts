import type { PageServerLoad } from "./$types.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { collectionname } from "./+page.svelte";
export const load: PageServerLoad = async ({ params }) => {
  let id = params.id;
  let item = await auth.client.FindOne<any>({ collectionname, query: { _id: id }, jwt: auth.access_token });
  let agentInstance = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "Agent Instance", _type: "resource" }, jwt: auth.access_token });
  let instance: any = await auth.client.CustomCommand({ command: "getagentpods", id: item._id, name: item.slug, jwt: auth.access_token })
  if (item != null && item.sleep == null) {
    item.sleep = false;
  }
  if (item != null && item.autostart == null) {
    item.autostart = false;
  }
  if (item != null && item.webserver == null) {
    item.webserver = false;
  }
  instance = JSON.parse(instance)[0];
  if (instance) {
    instance.showstatus = "unknown"
    if (instance.status && instance.status.phase) {
      instance.showstatus = instance.status.phase;
    }
    if (instance.showstatus == "running" || instance.showstatus == "Running") {
      if (instance.status != null && instance.status.containerStatuses != null && instance.status.containerStatuses.length > 0) {
        // instance.showstatus = instance.status.containerStatuses[0].state.running ? "running" : "stopped";
        instance.showstatus = instance.status.containerStatuses[0].started ? "Running" : "Stopped " + instance.status.containerStatuses[0].state.waiting.reason;
      }
    }
    if (instance.metadata.deletionTimestamp) instance.showstatus = "Deleting"
  }


  return { item, agentInstance, resourceMonitor:instance };
};
