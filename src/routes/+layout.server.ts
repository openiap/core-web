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
	try {
		await usersettings.dbload(access_token);
		const shortpage = (route.id != null && route.id.indexOf("/") > -1 ? route.id.split("/")[1] : "");
		workspaces = await auth.client.Query<Workspace>({ collectionname: "users", query: { _type: "workspace" }, jwt: access_token, top: 5 });
		let entities: any[] = [];
		const id = params.id;
		datacomponent.loadsettings(page);
		usersettings.entities_collectionname = (params.collection != null ? params.collection : usersettings.entities_collectionname);
		const { entities: entitiesdata, total_count: totalcount } = await datacomponent.Fetch(page, id, access_token);
		entities = entitiesdata;
		total_count = totalcount;
		let settings = datacomponent.getpagesettingsreactless();
		// console.log("page:", page, "count:", entities.length, "total:", total_count, "workspace count:", workspaces.length);
		return { protocol, domain, client_id, page, profile, access_token, wsurl, origin, entities, workspaces, id, settings, total_count };
	} catch (error) {
		console.error(error);
		return { protocol, domain, client_id, page, profile, access_token, wsurl, origin, entities: [], workspaces: [], item: null, id: "", settings: {}, total_count };
	}
};
