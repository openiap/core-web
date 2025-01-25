import { browser } from "$app/environment";
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

	async GetData(page: string, collectionname: string, query: any, access_token: string, workspacefilter: boolean = true) {
		let orderby = this.getOrderBy();
		let usequery = this.createQuery(this.settings.searchstring, query);
		let top = this.pagesize;
		let skip = this.settings.page_index * top;

		if (auth.isConnected == false) {
			return [];
		}
		if (collectionname == null || collectionname == "") {
			return [];
		}
		let queryas = undefined;
		if(workspacefilter == true) {
			if(usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
				queryas = usersettings.currentworkspace;
			}
		}
		const entities = await auth.client.Query<any>({
			collectionname: collectionname,
			query: usequery,
			orderby: orderby,
			skip: skip,
			top: top,
			queryas,
			jwt: access_token,
		});
		// if (Object.keys(query).length <= 3) {
		// 	console.log("collectionname", collectionname, "page:", this.settings.page, "idx:", this.settings.page_index, "res:", entities.length, "skip:", skip, "query:", query, "token:", access_token?.substring(0, 10));
		// } else {
		// 	console.log("collectionname", collectionname, "page:", this.settings.page, "idx:", this.settings.page_index, "res:", entities.length, "skip:", skip, "token:", access_token?.substring(0, 10));
		// }
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
		let usequery = this.createQuery(this.settings.searchstring, query);
		let queryas = undefined;
		if(workspacefilter == true) {
			if(usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
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
		if(raw == null) {
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
		if (searchstring.indexOf("{") == 0) {
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
			default:
				if (header.name != null && header.name != "") {
					return header.name;
				}
				return value.charAt(0).toUpperCase() + value.slice(1);
		}
	}
	defaultcolumnnames(page: string) {
		switch (page) {
			case "user":
				return ["_id", "name", "username", "email", "lastseen", "_created"];
			case "role":
				return ["_id", "name", "members", "_created"];
			case "/workitem":
			case "workitem":
				return ["name", "state", "retries", "priority", "wiq", "lastrun", "_created"];
			case "resource":
				return ["name", "_created", "_modified"];
			case "provider":
				return ["name", "provider", "_created", "_modified"];
			case "mailhistory":
				return [
					"_id",
					"name",
					"username",
					"email",
					"lastseen",
					"_created",
				];
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