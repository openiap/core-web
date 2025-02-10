import type { LayoutServerLoad } from "./$types.js";
import { base } from "$app/paths";
import type { Workspace } from "./workspace/schema.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import { data as datacomponent } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
export const load: LayoutServerLoad = async ({ locals, url, route, params }) => {
	// const { wsurl, protocol, domain, client_id, access_token, profile } = locals as any;
	// return { wsurl, protocol, domain, client_id, access_token, profile };
	const { protocol, domain, client_id, profile, access_token } = locals as any;
	let { wsurl } = locals as any;
	const { origin } = url;
	let workspaces: Workspace[] = [];
	let total_count = 99999;
	const page = url.pathname;
	const webcommit = auth.config?.webcommit;
	const webversion = auth.config?.webversion;
	try {
		await usersettings.dbload(access_token);
		const shortpage = (route.id != null && route.id.indexOf("/") > -1 ? route.id.split("/")[1] : "");
		workspaces = await auth.client.Query<Workspace>({ collectionname: "users", query: { _type: "workspace" }, jwt: access_token, top: 5 });
		if(usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
			let exists = workspaces.find(x=> x._id == usersettings.currentworkspace);
			if(exists == null) {
				let _workspace = await auth.client.FindOne<Workspace>({
					collectionname: "users",
					query: { _type: "workspace", _id: usersettings.currentworkspace },
					jwt: access_token
				});
				if(_workspace != null) {
					workspaces.pop();
					workspaces.unshift(_workspace);
				}
			}
		}
		let entities: any[] = [];
		const id = params.id;
		datacomponent.loadsettings(page);
		usersettings.entities_collectionname = (params.collection != null ? params.collection : usersettings.entities_collectionname);
		const { entities: entitiesdata, total_count: totalcount } = await datacomponent.Fetch(page, id, access_token);
		entities = entitiesdata;
		total_count = totalcount;
		let settings = datacomponent.getpagesettingsreactless();
		return { protocol, domain, client_id, page, profile, access_token, wsurl, origin, entities, workspaces, id, settings, total_count, webcommit, webversion };
	} catch (error) {
		console.error(error);
		return { protocol, domain, client_id, page, profile, access_token, wsurl, origin, entities: [], workspaces: [], item: null, id: "", settings: {}, total_count, webcommit, webversion };
	}
};
