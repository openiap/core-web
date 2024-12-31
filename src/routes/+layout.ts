import { base } from "$app/paths";
import { data as datacomponent } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import type { LayoutLoad } from "./$types.js";

export const load: LayoutLoad = async ({ data, fetch, url, route, params }) => {
	const { protocol, domain, client_id, access_token, profile } = data;
	let code = url?.searchParams?.get("code");
	try {
		await auth.clientinit(protocol, domain, client_id, url.origin, access_token, profile, fetch, null);
		await usersettings.dbload();
		const shortpage = (route.id != null && route.id.indexOf("/") > -1 ? route.id.split("/")[1] : "");
		const page = url.pathname;
		let entities: any[] = [];
		const id = params.id;
		datacomponent.loadsettings(page);
		let settings = datacomponent.settings;
		switch (page) {
			case base + "/agent":
				entities = await datacomponent.GetData(page, "agents", { _type: "agent" });
				break;
			case base + "/auditlog":
				entities = await datacomponent.GetData(page, "audit", { _type: "auditlog" });
				break;
			case base + "/client":
				entities = JSON.parse(await auth.client.CustomCommand({ command: "getclients", jwt: auth.access_token, }));
				settings.total_count = entities.length;
				break;
			case base + "/console":
				entities = await datacomponent.GetData(page, "config", { _type: "config" });
				break;
			case base + "/credential":
				entities = await datacomponent.GetData(page, "openrpa", { _type: "credential" });
				break;
			case base + "/customer":
				entities = await datacomponent.GetData(page, "users", { _type: "customer" });
				break;
			case base + "/entities":
				entities = await datacomponent.GetData(page, "users", { _type: "customer" });
				break;
			case base + "/files":
				entities = await datacomponent.GetData(page, "fs.files", {});
				break;
			case base + "/form":
				entities = await datacomponent.GetData(page, "forms", { _type: "form" });
				break;
			case base + "/formresource":
				entities = await datacomponent.GetData(page, "forms", { _type: "resource" });
				break;
			case base + "/hdrobot":
				entities = await datacomponent.GetData(page, "openrpa", { _type: "unattendedclient" });
				break;
			case base + "/mailhistory":
				entities = await datacomponent.GetData(page, "mailhist", {});
				break;
			case base + "/package":
				entities = await datacomponent.GetData(page, "agents", { _type: "package" });
				break;
			case base + "/provider":
				entities = await datacomponent.GetData(page, "config", { _type: "provider" });
				break;
			case base + "/resource":
				entities = await datacomponent.GetData(page, "config", { _type: "resource" });
				break;
			case base + "/role":
				entities = await datacomponent.GetData(page, "users", { _type: "role" });
				break;
			case base + "/user":
				entities = await datacomponent.GetData(page, "users", { _type: "user" });
				break;
			case base + "/workspace":
				entities = await datacomponent.GetData(page, "users", { _type: "workspace" });
				break;
			case base + `/workspace/${params.id}/member`:
				entities = await datacomponent.GetData(page, "users", { _type: "member", workspaceid: params.id, status: { "$ne": "rejected" } });
				break;
			case base + "/workspace/invites":
				const userid = auth.profile.sub;
				const email = auth.profile.email;
				const basequery = { _type: "member", "status": { "$in": ["pending", "rejected"] } };
				let query: any = { ...basequery, ...{ "$or": [{ "userid": userid }, { "email": email }] } };
				entities = await datacomponent.GetData(page, "users", query);
				break;
			default:
				break;
		}
		console.log(page, entities.length);
		return { ...data, code, entities, id, settings };
	} catch (error) {
		console.error(error);
		return { ...data, code, entities: [], id: "", settings: {} };
	}
};
