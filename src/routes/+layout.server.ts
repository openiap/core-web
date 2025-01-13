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
	let workspaces:Workspace[] = [];
	let total_count = 99999;
	try {
		await usersettings.dbload(access_token);
		const shortpage = (route.id != null && route.id.indexOf("/") > -1 ? route.id.split("/")[1] : "");
		workspaces = await auth.client.Query<Workspace>({ collectionname: "users", query: { _type: "workspace" }, jwt: access_token, top: 5 });
		const page = url.pathname;
		let entities: any[] = [];
		const id = params.id;
		datacomponent.loadsettings(page);
		switch (page) {
			case base + "/agent":
				entities = await datacomponent.GetData(page, "agents", { _type: "agent" }, access_token);
				total_count = await datacomponent.GetCount(page, "agents", { _type: "agent" }, access_token);
				break;
			case base + "/auditlog":
				entities = await datacomponent.GetData(page, "audit", { _type: "auditlog" }, access_token);
				total_count = await datacomponent.GetCount(page, "audit", { _type: "auditlog" }, access_token);
				break;
		case base + "/client":
				entities = JSON.parse(await auth.client.CustomCommand({ command: "getclients", jwt: access_token, }));
				total_count = entities.length;
				break;
			case base + "/console":
				entities = await datacomponent.GetData(page, "config", { _type: "config" }, access_token);
				total_count = await datacomponent.GetCount(page, "config", { _type: "config" }, access_token);
				break;
			case base + "/credential":
				entities = await datacomponent.GetData(page, "openrpa", { _type: "credential" }, access_token);
				total_count = await datacomponent.GetCount(page, "openrpa", { _type: "credential" }, access_token);
				break;
			case base + "/billingaccount":
				entities = await datacomponent.GetData(page, "users", { _type: "customer" }, access_token, false);
				total_count = await datacomponent.GetCount(page, "users", { _type: "customer" }, access_token, false);
				break;
			case base + `/billingaccount/${params.id}/billing`:
				entities = await auth.client.Query({ collectionname: "config", query: { _type: "resourceusage", "customerid": params.id }, jwt: access_token });
				total_count = await auth.client.Count({ collectionname: "config", query: { _type: "resourceusage", "customerid": params.id }, jwt: access_token });
				break;
			case base + "/entities":
				entities = await datacomponent.GetData(page, "users", { }, access_token);
				total_count = await datacomponent.GetCount(page, "users", { }, access_token);
				break;
			case base + "/files":
				entities = await datacomponent.GetData(page, "fs.files", {}, access_token);
				total_count = await datacomponent.GetCount(page, "fs.files", {}, access_token);
				break;
			case base + "/form":
				entities = await datacomponent.GetData(page, "forms", { _type: "form" }, access_token);
				total_count = await datacomponent.GetCount(page, "forms", { _type: "form" }, access_token);
				break;
			case base + "/formworkflow":
				entities = await datacomponent.GetData(page, "workflow", { _type: "workflow", web: true }, access_token);
				total_count = await datacomponent.GetCount(page, "workflow", { _type: "workflow", web: true }, access_token);
				break;
			case base + "/formresource":
				entities = await datacomponent.GetData(page, "forms", { _type: "resource" }, access_token);
				total_count = await datacomponent.GetCount(page, "forms", { _type: "resource" }, access_token);
				break;
			case base + "/hdrobot":
				entities = await datacomponent.GetData(page, "openrpa", { _type: "unattendedclient" }, access_token);
				total_count = await datacomponent.GetCount(page, "openrpa", { _type: "unattendedclient" }, access_token);
				break;
			case base + "/mailhistory":
				entities = await datacomponent.GetData(page, "mailhist", {}, access_token);
				total_count = await datacomponent.GetCount(page, "mailhist", {}, access_token);
				break;
			case base + "/package":
				entities = await datacomponent.GetData(page, "agents", { _type: "package" }, access_token);
				total_count = await datacomponent.GetCount(page, "agents", { _type: "package" }, access_token);
				break;
			case base + "/provider":
				entities = await datacomponent.GetData(page, "config", { _type: "provider" }, access_token);
				total_count = await datacomponent.GetCount(page, "config", { _type: "provider" }, access_token);
				break;
			case base + "/resource":
				entities = await datacomponent.GetData(page, "config", { _type: "resource" }, access_token);
				total_count = await datacomponent.GetCount(page, "config", { _type: "resource" }, access_token);
				break;
			case base + "/role":
				entities = await datacomponent.GetData(page, "users", { _type: "role" }, access_token);
				total_count = await datacomponent.GetCount(page, "users", { _type: "role" }, access_token);
				break;
			case base + "/user":
				entities = await datacomponent.GetData(page, "users", { _type: "user" }, access_token);
				total_count = await datacomponent.GetCount(page, "users", { _type: "user" }, access_token);
				break;
			case base + "/workspace":
				entities = await datacomponent.GetData(page, "users", { _type: "workspace" }, access_token, false);
				total_count = await datacomponent.GetCount(page, "users", { _type: "workspace" }, access_token, false);
				break;
			case base + `/workspace/${params.id}/member`:
				usersettings.currentworkspace = params.id as any;
				entities = await datacomponent.GetData(page, "users", { _type: "member", workspaceid: params.id, status: { "$ne": "rejected" } }, access_token);
				total_count = await datacomponent.GetCount(page, "users", { _type: "member", workspaceid: params.id, status: { "$ne": "rejected" } }, access_token);
				break;
			case base + `/workspace/${params.id}/member`:
				usersettings.currentworkspace = params.id as any;
				entities = await datacomponent.GetData(page, "users", { _type: "member" }, access_token, false);
				total_count = await datacomponent.GetCount(page, "users", { _type: "member" }, access_token, false);
				break;
			case base + "/workspace/${params.id}/billing":
				entities = await auth.client.Query({ collectionname: "config", query: { _type: "resourceusage", "workspaceid": params.id }, jwt: access_token });
				total_count = await auth.client.Count({ collectionname: "config", query: { _type: "resourceusage", "workspaceid": params.id }, jwt: access_token });
				break;
			case base + "/workspace/invites":
				const userid = auth.profile.sub;
				const email = auth.profile.email;
				// const basequery = { _type: "member", "status": { "$in": ["pending", "rejected"] } };
				const basequery = { _type: "member" };
				let query: any = { ...basequery, ...{ "$or": [{ "userid": userid }, { "email": email }] } };
				entities = await datacomponent.GetData(page, "users", query, access_token, false);
				total_count = await datacomponent.GetCount(page, "users", query, access_token, false);
				break;
			default:
				break;
		}
		let settings = datacomponent.getpagesettingsreactless();
		console.log(page, entities.length, workspaces.length);
		return { protocol, domain, client_id, profile, access_token, wsurl, origin, entities, workspaces, id, settings, total_count };
	} catch (error) {
		console.error(error);
		return { protocol, domain, client_id, profile, access_token, wsurl, origin, entities: [], workspaces: [], item: null, id: "", settings: {}, total_count };
	}
};
