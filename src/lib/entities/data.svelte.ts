import { browser } from "$app/environment";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte";
import { type sort } from "$lib/stores/usersettings.svelte";
import { usersettings, type pageSettings, type SettingsTableHeader } from "$lib/stores/usersettings.svelte.js";

export type TTableHeader = {
	name: string;
	field: string;
	headclass: string;
	cellclass: string;
	order: sort;
	orderindex: number;
	show: boolean;
}

export class TableHeader implements TTableHeader {
	name = "";
	field = "";
	headclass = "";
	cellclass = "";
	order: sort = "";
	orderindex = 0;
	show = $state(true);
}

class entitiesdata {
	settings: pageSettings = null as any;
	hide_empty_on_sort = true;
	errormessage = "";
	pagesize = $state(13);

	async Fetch(page: string, id: string | undefined, access_token: string): Promise<{ entities: any[], total_count: number }> {
		let entities: any[] = [], total_count: number = 0;
		switch (page) {
			case base + "/agent":
				if (usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
					entities = await this.GetData(page, "agents", { _type: "agent", _workspaceid: usersettings.currentworkspace }, access_token);
					total_count = await this.GetCount(page, "agents", { _type: "agent", _workspaceid: usersettings.currentworkspace }, access_token);
				} else {
					entities = await this.GetData(page, "agents", { _type: "agent" }, access_token);
					total_count = await this.GetCount(page, "agents", { _type: "agent" }, access_token);
				}
				break;
			case base + "/auditlog":
				entities = await this.GetData(page, "audit", {}, access_token);
				total_count = await this.GetCount(page, "audit", {}, access_token);
				break;
			case base + "/client":
				entities = JSON.parse(await auth.client.CustomCommand({ command: "getclients", jwt: access_token, }));
				total_count = entities.length;
				break;
			case base + "/console":
				entities = await this.GetData(page, "config", { _type: "config" }, access_token, false);
				total_count = entities.length;
				break;
			case base + "/credential":
				entities = await this.GetData(page, "openrpa", { _type: "credential" }, access_token);
				total_count = await this.GetCount(page, "openrpa", { _type: "credential" }, access_token);
				break;
			case base + "/billingaccount":
				entities = await this.GetData(page, "users", { _type: "customer" }, access_token, false);
				total_count = await this.GetCount(page, "users", { _type: "customer" }, access_token, false);
				break;
			case base + `/billingaccount/${id}/billing`:
				entities = JSON.parse(await auth.client.CustomCommand({ id: id, command: "getcustomerresources", jwt: access_token }));
				total_count = entities.length
				break;
			case base + "/entities":
				entities = await this.GetData(page, "openrpa", { _type: "credential" }, access_token);
				total_count = await this.GetCount(page, "openrpa", { _type: "credential" }, access_token);
			case base + `/entities/${usersettings.entities_collectionname}`:
				//usersettings.entities_collectionname = collection;
				entities = await this.GetData(page, usersettings.entities_collectionname, { }, access_token);
				total_count = await this.GetCount(page, usersettings.entities_collectionname, { }, access_token);
				if(entities.length > 0) {
					console.log("entities", entities[0]._id, entities[0].name);
				} else {
					console.log("entities", entities.length);
				}
				break;
			case base + "/files":
				entities = await this.GetData(page, "fs.files", {}, access_token);
				total_count = await this.GetCount(page, "fs.files", {}, access_token);
				break;
			case base + "/form":
				entities = await this.GetData(page, "forms", { _type: "form" }, access_token);
				total_count = await this.GetCount(page, "forms", { _type: "form" }, access_token);
				break;
			case base + "/formworkflow":
				entities = await this.GetData(page, "workflow", { _type: "workflow", web: true }, access_token);
				total_count = await this.GetCount(page, "workflow", { _type: "workflow", web: true }, access_token);
				break;
			case base + "/formresource":
				entities = await this.GetData(page, "forms", { _type: "resource" }, access_token);
				total_count = await this.GetCount(page, "forms", { _type: "resource" }, access_token);
				break;
			case base + "/hdrobot":
				entities = await this.GetData(page, "openrpa", { _type: "unattendedclient" }, access_token);
				total_count = await this.GetCount(page, "openrpa", { _type: "unattendedclient" }, access_token);
				break;
			case base + "/mailhistory":
				entities = await this.GetData(page, "mailhist", {}, access_token);
				total_count = await this.GetCount(page, "mailhist", {}, access_token);
				break;
			case base + "/package":
				entities = await this.GetData(page, "agents", { _type: "package" }, access_token);
				total_count = await this.GetCount(page, "agents", { _type: "package" }, access_token);
				break;
			case base + "/provider":
				entities = await this.GetData(page, "config", { _type: "provider" }, access_token);
				total_count = await this.GetCount(page, "config", { _type: "provider" }, access_token);
				break;
			case base + "/resource":
				entities = await this.GetData(page, "config", { _type: "resource" }, access_token, false);
				total_count = await this.GetCount(page, "config", { _type: "resource" }, access_token, false);
				break;
			case base + "/role":
				entities = await this.GetData(page, "users", { _type: "role" }, access_token);
				total_count = await this.GetCount(page, "users", { _type: "role" }, access_token);
				break;
			case base + "/rpaworkflow":
				entities = await this.GetData(page, "openrpa", { _type: "workflow" }, access_token);
				total_count = await this.GetCount(page, "openrpa", { _type: "workflow" }, access_token);
				break;
			case base + "/user":
				entities = await this.GetData(page, "users", { _type: "user" }, access_token);
				total_count = await this.GetCount(page, "users", { _type: "user" }, access_token);
				break;
			case base + "/workitem":
				entities = await this.GetData(page, "workitems", {}, access_token, false);
				total_count = await this.GetCount(page, "workitems", {}, access_token, false);
				break;
			case base + `/workitem/${id}`:
				entities = await this.GetData(page, "workitems", { wiqid: id }, access_token, false);
				total_count = await this.GetCount(page, "workitems", { wiqid: id }, access_token, false);
				break;
			case base + "/workitemqueue":
				entities = await this.GetData(page, "mq", { _type: "workitemqueue" }, access_token, false);
				total_count = await this.GetCount(page, "mq", { _type: "workitemqueue" }, access_token, false);
				break;
			case base + "/workspace":
				entities = await this.GetData(page, "users", { _type: "workspace" }, access_token, false);
				total_count = await this.GetCount(page, "users", { _type: "workspace" }, access_token, false);
				break;
			case base + `/workspace/${id}/member`:
				usersettings.currentworkspace = id as any;
				entities = await this.GetData(page, "users", { _type: "member", workspaceid: id, status: { "$ne": "rejected" } }, access_token);
				total_count = await this.GetCount(page, "users", { _type: "member", workspaceid: id, status: { "$ne": "rejected" } }, access_token);
				break;
			case base + `/workspace/${id}/member`:
				usersettings.currentworkspace = id as any;
				entities = await this.GetData(page, "users", { _type: "member" }, access_token, false);
				total_count = await this.GetCount(page, "users", { _type: "member" }, access_token, false);
				break;
			case base + `/workspace/${id}/billing`:
				entities = JSON.parse(await auth.client.CustomCommand({ id: id, command: "getworkspaceresources", jwt: access_token }));
				total_count = entities.length
				break;

			case base + "/workspace/invites":
				const userid = auth.profile.sub;
				const email = auth.profile.email;
				// const basequery = { _type: "member", "status": { "$in": ["pending", "rejected"] } };
				const basequery = { _type: "member" };
				let query: any = { ...basequery, ...{ "$or": [{ "userid": userid }, { "email": email }] } };
				entities = await this.GetData(page, "users", query, access_token, false);
				total_count = await this.GetCount(page, "users", query, access_token, false);
				break;
			default:
				console.log("Unknown page", page, id);
				break;
		}
		// console.log("page:", page, "count:", entities.length, "total:", total_count);
		return { entities, total_count };
	}

	async GetData(page: string, collectionname: string, query: any, access_token: string, workspacefilter: boolean = true) {
		let orderby = this.getOrderBy();
		let usequery = this.createQuery(this.settings.searchstring, query);
		let top = this.pagesize;
		let skip = this.settings.page_index * top;

		if (auth.isConnected == false) {
			console.log("not connected");
			return [];
		}
		if (collectionname == null || collectionname == "") {
			console.log("no collectionname");
			return [];
		}
		let queryas = undefined;
		if (workspacefilter == true) {
			if (this.settings.searchstring.length == 24 && this.settings.searchstring.match(/^[0-9a-fA-F]{24}$/)) {
			} else {
				if (usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
					queryas = usersettings.currentworkspace;
				}
			}
		}
		const entities = await auth.client.Query<any>({
			collectionname: collectionname,
			query: usequery,
			orderby: orderby,
			projection: { "Xaml": 0, "xml": 0 }, // exclude Xaml (openrpa workflows) and xml (openrpa instance state) fields
			skip: skip,
			top: top,
			queryas,
			jwt: access_token,
		});
		if (Object.keys(query).length <= 3) {
			console.log("collectionname1", collectionname, "page:", this.settings.page, "idx:", this.settings.page_index, "res:", entities.length, "skip:", skip, "query:", query, "token:", access_token?.substring(0, 10));
		} else {
			console.log("collectionname2", collectionname, "page:", this.settings.page, "idx:", this.settings.page_index, "res:", entities.length, "skip:", skip, "token:", access_token?.substring(0, 10));
		}
		return entities;
	}
	async GetCount(page: string, collectionname: string, query: any, access_token: string, workspacefilter: boolean = true) {
		let total_count = 99999;
		if (auth.isConnected == false) {
			return total_count;
		}
		if (collectionname == null || collectionname == "") {
			return total_count;
		}
		if(!browser) {
			return total_count;
		}
		let usequery = this.createQuery(this.settings.searchstring, query);
		let queryas = undefined;
		if (workspacefilter == true) {
			if (usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
				queryas = usersettings.currentworkspace;
			}
		}
		if (["cvr", "cvrfinancial", "cvrperson", "dbusage"].indexOf(collectionname) == -1) {
			total_count = await auth.client.Count({
				collectionname,
				query: usequery,
				jwt: access_token,
				queryas,
			});
		} else if (browser) {
			total_count = await auth.client.Count({
				collectionname,
				query: usequery,
				jwt: access_token,
				queryas,
			});
		}
		return total_count;
	}
	persist() {
		usersettings.persist();
	}
	parsesettings(raw: any) {
		if (raw == null) {
			return;
		}
		usersettings.loadpage(raw);
		if (raw.page != null) {
			this.settings = usersettings.getpagesettings(raw.page);
		}
	}
	loadsettings(page: string) {
		this.settings = usersettings.getpagesettings(page);
	}
	getpagesettingsreactless() {
		return $state.snapshot(this.settings);
	}

	SaveHeaders(tableheaders: TTableHeader[]) {
		let result: SettingsTableHeader[] = [];
		for (let i = 0; i < tableheaders.length; i++) {
			if (tableheaders[i].show == false) continue;
			const head = {
				field: $state.snapshot(tableheaders[i].field),
				order: $state.snapshot(tableheaders[i].order),
				orderindex: $state.snapshot(tableheaders[i].orderindex)
			}
			result.push(head);
		}
		this.settings.headers = result;
		usersettings.persist();
	}
	private getOrderBy() {
		const orderby: { [key: string]: number } = {};
		let ordered = this.settings.headers
			.filter((x) => x.order != "")
			.sort((a, b) => {
				return a.orderindex - b.orderindex;
			});
		for (let i = 0; i < ordered.length; i++) {
			const sortKey = ordered[i];
			if (sortKey.order != null && sortKey.order != "") {
				orderby[sortKey.field] = sortKey.order == "desc" ? -1 : 1;
			}
		}
		if (Object.keys(orderby).length == 0) {
			return { _id: -1 };
		}
		return orderby;
	}
	private parseJson(txt: string, reviver: any, context: any) {
		context = context || 20;
		try {
			return JSON.parse(txt, reviver);
		} catch (e: any) {
			if (typeof txt !== "string") {
				const isEmptyArray =
					Array.isArray(txt) && (txt as any).length === 0;
				const errorMessage =
					"Cannot parse " +
					(isEmptyArray ? "an empty array" : String(txt));
				this.errormessage = errorMessage;
				throw new TypeError(errorMessage);
			}
			const syntaxErr = e.message.match(
				/^Unexpected token.*position\s+(\d+)/i,
			);
			const errIdx = syntaxErr
				? +syntaxErr[1]
				: e.message.match(/^Unexpected end of JSON.*/i)
					? txt.length - 1
					: null;
			if (errIdx != null) {
				const start = errIdx <= context ? 0 : errIdx - context;
				const end =
					errIdx + context >= txt.length
						? txt.length
						: errIdx + context;
				e.message += ` while parsing near "${start === 0 ? "" : "..."
					}${txt.slice(start, end)}${end === txt.length ? "" : "..."}"`;
			} else {
				e.message += ` while parsing "${txt.slice(0, context * 2)}"`;
			}
			throw e;
		}
	}
	private safeEval(jsStr: string) {
		try {
			return Function(`"use strict";return (` + jsStr + `)`)();
		} catch (e: any) {
			this.errormessage = e.message;
			return null;
		}
	}

	createQuery(searchstring: string, query: any) {
		let q: any = { ...query };
		if (searchstring == null || searchstring == "") {
			return q;
		}

		if (searchstring.length == 24 && searchstring.match(/^[0-9a-fA-F]{24}$/)) {
			q["_id"] = searchstring;
		} else if (searchstring.indexOf("{") == 0) {
			if (searchstring.lastIndexOf("}") == searchstring.length - 1) {
				try {
					q = this.parseJson(searchstring, null, null);
				} catch (e: any) {
					try {
						q = this.safeEval(searchstring);
					} catch (error2: any) {
						this.errormessage = e.message;
						return null;
					}
				}
			} else {
				this.errormessage = "Incomplete query object";
			}
		} else {
			q["name"] = { $regex: searchstring, $options: "i" };
		}
		return q;
	}

	RenderHeaderName(header: TableHeader) {
		if (header == null) {
			return "ERROR!!!";
		}
		let value = header.field;
		if (header.field.indexOf(".") > -1) {
			value = header.field.split(".").pop() as any;
		}
		switch (value) {
			case "_id":
				return "ID";
			case "name":
				return "Name";
			case "type":
				return "Type";
			case "_acl":
				return "ACL";
			case "_encrypt":
				return "Encrypt";
			case "_type":
				return "Type";
			case "_version":
				return "Version";
			case "_created":
				return "Created";
			case "_createdby":
				return "Created by";
			case "_createdbyid":
				return "Created by ID";
			case "_modified":
				return "Modified";
			case "_modifiedby":
				return "Modified by";
			case "_modifiedbyid":
				return "Modified by ID";
			case "_productname":
				return "Product";
			case "_billingid":
				return "Billing ID";
			case "errortype":
				return "Error type";
			case "wiq":
				return "Queue";
			default:
				if (header.name != null && header.name != "") {
					return header.name;
				}
				return value.charAt(0).toUpperCase() + value.slice(1);
		}
	}
	defaultcolumnnames(page: string) {
		switch (page) {
			case "/ui/user":
			case "/user":
			case "user":
				return ["_id", "name", "username", "email", "lastseen", "_created"];
			case "/ui/role":
			case "/role":
			case "role":
				return ["_id", "name", "members", "_created"];
			case "/ui/workitem":
			case "/workitem":
			case "workitem":
				return ["name", "state", "errortype", "retries", "priority", "wiq", "lastrun", "_created"];
			case "/ui/resource":
			case "/resource":
			case "resource":
				return ["name", "_created", "_modified"];
			case "/ui/provider":
			case "/provider":
			case "provider":
				return ["name", "provider", "_created", "_modified"];
			case "/ui/mailhistory":
			case "/mailhistory":
			case "mailhistory":
				return [
					"_id",
					"name",
					"username",
					"email",
					"lastseen",
					"_created",
				];
			case "/ui/hdrobot":
			case "/hdrobot":
			case "hdrobot":
				return ["name", "_created", "_modified"];
			case "formresource":
				return ["name", "collection", "_createdby", "_created", "_modified"];
			case "files":
				return ["filename", "metadata.name", "length", "metadata._created"];
			case "billingaccount":
				return ["name", "dbusage", "_created", "_modified"];
			case "credential":
				return ["name", "username", "_created", "_modified"];
			case "client":
				return ["id", "name", "clientagent", "clientversion", "_created", "remoteip"];
			case "auditlog":
				return ["_id", "name", "_type", "impostorname", "clientagent", "clientversion", "remoteip", "_created"];
			case "agent":
				return ["name", "image", "os", "_productname", "_createdby", "status"];
			case "package":
				return ["name", "language", "_createdby", "_created"];
			case "workspace":
				return ["name", "_productname", "_created", "_modified"];
			case "member":
				return ["name", "status", "role", "_modified"];
			case "/workspace/invites":
			case "invites":
				return ["workspacename", "status", "role"];
			case "formworkflow":
				return ["name", "_created"];
			case "rpaworkflow":
				return ["name", "_createdby", "_modified", "runtime"];
			case "entities-cvr":
				return ["name", "cvr", "virksomhedsformkort", "sidstOpdateret", "stiftelsesDato", "ophoersDato", "cvrstatus"];
			default:
				return ["_id", "name", "_type", "_createdby", "_created"];
		}
	}
}

let defaultentitiesdata = new entitiesdata();
export const data = $state(defaultentitiesdata);