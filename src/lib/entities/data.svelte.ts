import { browser } from "$app/environment";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte";
import { type sort } from "$lib/stores/usersettings.svelte";
import { usersettings, type pageSettings, type SettingsTableHeader } from "$lib/stores/usersettings.svelte.js";
import { toast } from "svelte-sonner";

const server_skipcollections = ["audit", "dbusage", "openrpa_instances", "workitems"];

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

	async Fetch(page: string, id: string | undefined, access_token: string): Promise<{ entities: any[], total_count: number, collectionname: string }> {
		let entities: any[] = [], total_count: number = 0, collectionname: string = "entities";
		try {
			switch (page) {
				case base:
				case base + "/":
					if (auth.profile == null) {
						entities = [];
						total_count = 0;
						break;
					}
					const ors: any[] = [];
					ors.push({ targetid: auth.profile.sub });
					// let profileroles = auth.profile?.roles || [];
					// profileroles.forEach(role => {
					// 	ors.push({ targetid: role._id });
					// });
					let taskquery = { $or: ors, $and: [{ state: { $ne: "completed" } }, { state: { $ne: "failed" } }] };
					collectionname = "workflow_instances";
					entities = await this.GetData(page, collectionname, taskquery, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, taskquery, access_token, false);
					}
					break;
				case base + "/agent":
					collectionname = "agents";
					if (usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
						entities = await this.GetData(page, collectionname, { _type: "agent", _workspaceid: usersettings.currentworkspace }, access_token);
						total_count = entities.length;
						if (entities.length >= usersettings.pagesize) {
							total_count = await this.GetCount(page, collectionname, { _type: "agent", _workspaceid: usersettings.currentworkspace }, access_token);
						}
					} else {
						entities = await this.GetData(page, collectionname, { _type: "agent" }, access_token);
						total_count = entities.length;
						if (entities.length >= usersettings.pagesize) {
							total_count = await this.GetCount(page, collectionname, { _type: "agent" }, access_token);
						}
					}
					break;
				case base + "/auditlog":
					collectionname = "audit";
					entities = await this.GetData(page, collectionname, {}, access_token);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, {}, access_token);
					}
					break;
				case base + "/client":
					collectionname = "customcommand"
					entities = JSON.parse(await auth.client.CustomCommand({ command: "getclients", jwt: access_token, }));
					total_count = entities.length;
					break;
				case base + "/console":
					collectionname = "config";
					entities = await this.GetData(page, collectionname, { _type: "config" }, access_token, false);
					total_count = entities.length;
					break;
				case base + "/credential":
					collectionname = "openrpa"
					entities = await this.GetData(page, collectionname, { _type: "credential" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "credential" }, access_token, false);
					}
					break;
				case base + "/chat/hist":
					collectionname = "llmchat"
					entities = await this.GetData(page, collectionname, { _type: "thread" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "thread" }, access_token, false);
					}
					break;
				case base + "/billingaccount":
					collectionname = "users"
					entities = await this.GetData(page, collectionname, { _type: "customer" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "customer" }, access_token, false);
					}
					break;
				case base + `/billingaccount/${id}/billing`:
					collectionname = "customcommand"
					entities = JSON.parse(await auth.client.CustomCommand({ id: id, command: "getcustomerresources", jwt: access_token }));
					total_count = entities.length
					break;
				case base + "/entities":
					collectionname = "openrpa"
					entities = await this.GetData(page, collectionname, { _type: "credential" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "credential" }, access_token, false);
					}
				case base + `/entities/${usersettings.entities_collectionname}`:
					collectionname = usersettings.entities_collectionname;
					entities = await this.GetData(page, collectionname, {}, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, {}, access_token, false);
					}
					break;
				case base + `/entities/${usersettings.entities_collectionname}/deleted`:
					collectionname = usersettings.entities_collectionname + "_hist";
					entities = await this.GetData(page, collectionname, { _deleted: { "$exists": true } }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, {}, access_token, false);
					}
					break;
				case base + `/entities/${usersettings.entities_collectionname}/history/${id}`:
					collectionname = usersettings.entities_collectionname + "_hist";
					entities = await this.GetData(page, collectionname, { id }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { id }, access_token, false);
					}
					break;
				case base + "/files":
					collectionname = "fs.files";
					entities = await this.GetData(page, collectionname, {}, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, {}, access_token, false);
					}
					break;
				case base + "/form":
					collectionname = "forms";
					entities = await this.GetData(page, collectionname, { _type: "form" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "form" }, access_token, false);
					}
					break;
				case base + "/formworkflow":
					collectionname = "workflow";
					entities = await this.GetData(page, collectionname, { _type: "workflow", web: true }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "workflow", web: true }, access_token, false);
					}
					break;
				case base + "/formresource":
					collectionname = "forms";
					entities = await this.GetData(page, collectionname, { _type: "resource" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "resource" }, access_token, false);
					}
					break;
				case base + "/hdrobot":
					collectionname = "openrpa"
					entities = await this.GetData(page, collectionname, { _type: "unattendedclient" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "unattendedclient" }, access_token, false);
					}
					break;
				case base + "/licensekey":
					collectionname = "config";
					entities = await this.GetData(page, collectionname, { _type: "license" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "license" }, access_token, false);
					}
					break;
				case base + "/mailhistory":
					collectionname = "mailhist";
					entities = await this.GetData(page, collectionname, {}, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, {}, access_token, false);
					}
					break;
				case base + "/package":
					collectionname = "agents";
					entities = await this.GetData(page, collectionname, { _type: "package" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "package" }, access_token, false);
					}
					break;
				case base + "/provider":
					collectionname = "config";
					entities = await this.GetData(page, collectionname, { _type: "provider" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "provider" }, access_token, false);
					}
					break;
				case base + "/resource":
					collectionname = "config";
					entities = await this.GetData(page, collectionname, { _type: "resource" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "resource" }, access_token, false);
					}
					break;
				case base + "/role":
					collectionname = "users";
					entities = await this.GetData(page, collectionname, { _type: "role" }, access_token);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "role" }, access_token);
					}
					break;
				case base + "/rpaworkflow":
					collectionname = "openrpa"
					entities = await this.GetData(page, collectionname, { _type: "workflow" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "workflow" }, access_token, false);
					}
					break;
				case base + "/user":
					collectionname = "users";
					entities = await this.GetData(page, collectionname, { _type: "user" }, access_token);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "user" }, access_token);
					}
					break;
				case base + "/workitem":
					collectionname = "workitems";
					let workitemQuery = {}
					if (usersettings.workitemfilter != null && usersettings.workitemfilter != "all") {
						workitemQuery = { state: usersettings.workitemfilter }
					}
					else {
						workitemQuery = {}
					}
					entities = await this.GetData(page, collectionname, workitemQuery, access_token);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, {}, access_token);
					}
					break;
				case base + `/workitem/${id}`:
					collectionname = "workitems";
					let workitemidQuery = { wiqid: id }
					if (usersettings.workitemfilter != null && usersettings.workitemfilter != "all") {
						// @ts-ignore
						workitemidQuery = { wiqid: id, state: usersettings.workitemfilter }
					}
					else {
						workitemidQuery = { wiqid: id }
					}
					entities = await this.GetData(page, collectionname, workitemidQuery, access_token);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { wiqid: id }, access_token);
					}
					break;
				case base + "/workitemqueue":
					collectionname = "mq";
					entities = await this.GetData(page, collectionname, { _type: "workitemqueue" }, access_token);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "workitemqueue" }, access_token);
					}
					break;
				case base + "/workspace":
					collectionname = "users";
					entities = await this.GetData(page, collectionname, { _type: "workspace" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "workspace" }, access_token, false);
					}
					break;
				case base + `/workspace/${id}/member`:
					collectionname = "users";
					entities = await this.GetData(page, collectionname, { _type: "member", workspaceid: id, status: { "$ne": "rejected" } }, access_token);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "member", workspaceid: id, status: { "$ne": "rejected" } }, access_token);
					}
					break;
				case base + `/workspace/${id}/member`:
					collectionname = "users";
					entities = await this.GetData(page, collectionname, { _type: "member" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "member" }, access_token, false);
					}
					break;
				case base + `/workspace/${id}/billing`:
					collectionname = "customcommand"
					entities = JSON.parse(await auth.client.CustomCommand({ id: id, command: "getworkspaceresources", jwt: access_token }));
					total_count = entities.length
					break;
				case base + "/workspace/invites":
					collectionname = "users";
					const userid = auth.profile.sub;
					const email = auth.profile.email;
					// const basequery = { _type: "member", "status": { "$in": ["pending", "rejected"] } };
					const basequery = { _type: "member" };
					let query: any = { ...basequery, ...{ "$or": [{ "userid": userid }, { "email": email }] } };
					entities = await this.GetData(page, collectionname, query, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, query, access_token, false);
					}
					break;
				case base + "/entityrestriction":
					collectionname = "config";
					entities = await this.GetData(page, collectionname, { _type: "restriction" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "restriction" }, access_token, false);
					}
					break;
				case base + "/oauthclient":
					collectionname = "config";
					entities = await this.GetData(page, collectionname, { _type: "oauthclient" }, access_token, false);
					total_count = entities.length;
					if (entities.length >= usersettings.pagesize) {
						total_count = await this.GetCount(page, collectionname, { _type: "oauthclient" }, access_token, false);
					}
					break;
				default:
					console.debug("Unknown page", page, id);
					break;
			}
		} catch (error: any) {
			if (browser) {
				toast.error("Error getting data", {
					description: error.message,
				});
			} else {
				console.error("Error getting data", error.message);
			}
		}
		return { entities, total_count, collectionname };
	}

	async GetData(page: string, collectionname: string, query: any, access_token: string, workspacefilter: boolean = true) {
		let orderby = this.getOrderBy(page, collectionname);
		let usequery = this.createQuery(collectionname, this.settings.searchstring, query);
		let top = usersettings.pagesize;
		let skip = this.settings.page_index * top;

		if (auth.isConnected == false) {
			return [];
		}
		if (collectionname == null || collectionname == "") {
			return [];
		}
		let queryas = undefined;
		if (workspacefilter == true && ["cvr", "cvrfinancial", "cvrperson"].indexOf(collectionname) == -1) {
			if (collectionname == "mq" || collectionname == "workitems") {
				if (usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
					let or = [
						{ "_workspaceid": usersettings.currentworkspace },
						{ "_workspaceid": { "$exists": false } },
					]
					usequery = { ...usequery, "$or": or };
				}
			} else if (this.settings.searchstring.length == 24 && this.settings.searchstring.match(/^[0-9a-fA-F]{24}$/)) {
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
			console.debug("collectionname", collectionname, "page:", this.settings.page, "idx:", this.settings.page_index, "res:", entities.length, "skip:", skip, "query:", query, "token:", access_token?.substring(0, 10));
		} else {
			console.debug("collectionname", collectionname, "page:", this.settings.page, "idx:", this.settings.page_index, "res:", entities.length, "skip:", skip, "token:", access_token?.substring(0, 10));
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
		if (!browser) {
			if (server_skipcollections.indexOf(collectionname) > -1) {
				return total_count;
			}
		}
		let usequery = this.createQuery(collectionname, this.settings.searchstring, query);
		let queryas = undefined;
		if (workspacefilter == true && ["cvr", "cvrfinancial", "cvrperson"].indexOf(collectionname) == -1) {
			if (usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
				queryas = usersettings.currentworkspace;
			}
		}
		if (["cvr", "cvrfinancial", "cvrperson"].indexOf(collectionname) == -1) {
			total_count = await auth.client.Count({
				collectionname,
				query: usequery,
				jwt: access_token,
				queryas,
			});
		} else if (browser) {
			total_count = 99999;
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
	private getOrderBy(page: string, collectionname: string) {
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
			if (collectionname.indexOf("_hist") > -1) {
				if (page.indexOf("/history/") > -1) {
					return { _version: -1 };
				} else {
					return { _deleted: -1 };
				}

			}
			return { _id: -1 };
		}
		return orderby;
	}
	public parseJson(txt: string, reviver: any, context: any) {
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
	public safeEval(jsStr: string) {
		try {
			return Function(`"use strict";return (` + jsStr + `)`)();
		} catch (e: any) {
			this.errormessage = e.message;
			return null;
		}
	}

	createQuery(collectionname: string, searchstring: string, query: any) {
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
			if (collectionname == "openrpa") {
				let or = [
					{ "name": { $regex: searchstring, $options: "i" } },
					{ "projectandname": { $regex: searchstring, $options: "i" } }]
				q["$or"] = or;

			}
			else if (collectionname == "users") {
				let or = [
					{ "name": { $regex: searchstring, $options: "i" } },
					{ "email": { $regex: searchstring, $options: "i" } }]
				q["$or"] = or;
			}
			else {
				q["name"] = { $regex: searchstring, $options: "i" };
			}
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
			case "id":
				return "ID*";
			case "name":
				return "Name";
			case "os":
				return "OS";
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
			case "_deleted":
				return "Deleted";
			case "_deletedby":
				return "Deleted by";
			case "_deletedbyid":
				return "Deleted by ID";
			case "_productname":
				return "Product";
			case "_billingid":
				return "Billing ID";
			case "licenseversion":
				return "Version";
			case "errortype":
				return "Error type";
			case "wiq":
				return "Queue";
			case "clientagent":
				return "Client Agent";
			case "clientversion":
				return "Client Version";
			case "remoteip":
				return "Remote IP";
			case "impostorname":
				return "Impostor Name";
			case "dbusage":
				return "DB Usage";
			case "filename":
				return "File Name";
			case "metadata.name":
				return "Name";
			case "readcount":
				return "Read Count";
			case "nodered_id":
				return "NodeRED ID";
			case "projectandname":
				return "Project and Name";
			case "docsExamined":
				return "Docs Examined";
			case "nreturned":
				return "N Returned";
			case "planSummary":
				return "Plan Summary";
			case "ts":
				return "TS";
			case "ns":
				return "NS";
			case "op":
				return "OP";
			case "nextrun":
				return "Next Run";
			case "lastrun":
				return "Last Run";
			default:
				if (header.name != null && header.name != "") {
					return header.name;
				}
				return value.charAt(0).toUpperCase() + value.slice(1);
		}
	}
	defaultcolumnnames(page: string) {
		let _page = page.replace(base, "");
		switch (_page) {
			case "/auditlog":
				return ["_id", "name", "success", "_type", "impostorname", "clientagent", "clientversion", "remoteip", "_created"];
			case "/agent":
				return ["name", "image", "os", "_productname", "_createdby", "status"];
			case "/entities/agents":
				return ["name", "image", "os", "_productname", "_type", "_createdby"];
			case "/user":
				if (auth.config.validate_emails == true || (auth.config.validate_user_form != null && auth.config.validate_user_form != "")) {
					return ["_id", "name", "username", "email", "validated", "lastseen", "_created"];
				}
				return ["_id", "name", "username", "email", "lastseen", "_created"];
			case "/role":
				return ["_id", "name", "members", "_created"];
			case "/entityrestriction":
				return ["_id", "name", "collection", "_created"];
			case "/entities/users":
				if (auth.config.validate_emails == true || (auth.config.validate_user_form != null && auth.config.validate_user_form != "")) {
					return ["_id", "name", "username", "email", "validated", "lastseen", "members", "_type", "_created"];
				}
				return ["_id", "name", "username", "email", "lastseen", "members", "_type", "_created"];

			case "/chat/hist":
				return ["_id", "name", "_created"];
			case "/workitem":
			case "/entities/workitems":
				return ["name", "state", "errortype", "retries", "priority", "wiq", "nextrun", "lastrun", "_created"];
			case "/entities/dbusage":
				return ["username", "collection", "size", "timestamp"];
			case "/entities/nodered":
				return ["_id", "name", "nodered_id", "_type", "_createdby", "_created"];
			case "/entities/workflow_instances":
				return ["_id", "name", "state", "_type", "_createdby", "_created"];
			case "/entities/openrpa":
				return ["_id", "name", "projectandname", "_type", "_createdby", "_created"];
			case "/entities/openrpa_instances":
				return ["_id", "RelativeFilename", "state", "_type", "_createdby", "_created"];
			case "/entities/system.profile":
				return ["op", "ns", "docsExamined", "nreturned", "millis", "planSummary", "ts"];
			case "/resource":
				return ["name", "_created", "_modified"];
			case "/provider":
				return ["name", "provider", "_created", "_modified"];
			case "/licensekey":
				return [
					"name",
					"licenseversion",
					"_productname",
					"connections",
					"workspaces",
					"gitrepos",
					"_created",
				];
			case "/mailhistory":
			case "/entities/mailhist":
				return [
					"_id",
					"name",
					"to",
					"read",
					"readcount",
					"_created",
					"_modified",
				];
			case "/hdrobot":
				return ["name", "_created", "_modified"];
			case "/formresource":
				return ["name", "collection", "_createdby", "_created", "_modified"];
			case "/files":
				return ["filename", "metadata.name", "length", "metadata._created"];
			case "/billingaccount":
				return ["name", "dbusage", "_created", "_modified"];
			case "/credential":
				return ["name", "username", "_created", "_modified"];
			case "/client":
				return ["id", "name", "clientagent", "clientversion", "_created", "remoteip"];
			case "/package":
				return ["name", "language", "_createdby", "_created"];
			case "/workspace":
				return ["name", "_productname", "_created", "_modified"];
			case `/workspace/${usersettings?.currentworkspace}/member`:
			case "/member":
				return ["name", "status", "role", "_modified"];
			case "/workspace/invites":
			case "/invites":
				return ["workspacename", "status", "role"];
			case "/formworkflow":
				return ["name", "_created"];
			case "/rpaworkflow":
				return ["name", "_createdby", "_modified"];
			case "/entities/cvr":
				return ["name", "cvr", "virksomhedsformkort", "sidstOpdateret", "stiftelsesDato", "ophoersDato", "cvrstatus"];
			default:
				if (_page.startsWith("/chat/hist/")) {
					return ["_id", "name", "_type", "_createdby", "_created", "_modified"];
				} else if (_page.startsWith("/workitem/")) {
					return ["name", "state", "errortype", "retries", "priority", "wiq", "lastrun", "_created"];
				} else if (page.endsWith("/deleted")) {
					console.debug("Unknown deleted page", page);
					return ["_id", "name", "_type", "_deleted", "_deletedby", "_created", "_version"];
				} else if (_page.startsWith("/entities/")) {
					if (_page.endsWith(".files")) {
						return ["_id", "metadata.name", "metadata._createdby", "metadata._created"];
					}
				} else if (page.indexOf("/history/") > -1) {
					console.debug("Unknown history page", page);
					return ["_id", "name", "_createdby", "_modified", "_deleted", "_version"];
				} else if (page.endsWith("/duplicates")) {
					return ["_id", "name", "count"];
				}
				console.debug("Unknown page", page);
				return ["_id", "name", "_type", "_createdby", "_created", "_modified"];
		}
	}
}

let defaultentitiesdata = new entitiesdata();
export const data = $state(defaultentitiesdata);