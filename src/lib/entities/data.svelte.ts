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
	show = true;
}

class entitiesdata {
	settings: pageSettings = null as any;
	hide_empty_on_sort = true;
	errormessage = "";
	async GetData(page: string, collectionname: string, query: any, access_token: string) {
		let orderby = this.getOrderBy();
		let usequery = this.createQuery(this.settings.searchstring, query);
		let top = 5;
		let skip = this.settings.page_index * top;

		if (auth.isConnected == false) {
			return [];
		}
		if (collectionname == null || collectionname == "") {
			return [];
		}
		const entities = await auth.client.Query<any>({
			collectionname: collectionname,
			query: usequery,
			orderby: orderby,
			skip: skip,
			top: 5,
			jwt: access_token,
		});
		if (["cvr", "cvrfinancial", "cvrperson"].indexOf(collectionname) == -1) {
			this.settings.total_count = await auth.client.Count({
				collectionname,
				query: usequery,
				jwt: access_token,
			});
		} else if (browser) {
			auth.client.Count({
				collectionname,
				query: usequery,
				jwt: access_token,
			}).then((count) => {
				this.settings.total_count = count;
			});
		}
		// console.log("GetData", collectionname, usequery, orderby, this.settings.page, this.settings.page_index, entities.length, this.settings.total_count, access_token?.substring(0, 10));
		console.log("GetData", collectionname, "page:", this.settings.page, "idx:", this.settings.page_index, "res:", entities.length, "skip:", skip, "total:", this.settings.total_count, "token:", access_token?.substring(0, 10));
		return entities;
	}
	persist() {
		usersettings.persist();
	}
	parsesettings(raw: any) {
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
			return "";
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

	defaultcolumnnames(page: string) {
		switch (page) {
			case "user":
				return ["_id", "name", "username", "email", "lastseen", "_created"];
			case "role":
				return ["_id", "name", "members", "_created"];
			case "workitem":
				return ["name", "state", "retries", "priority", "queue", "lastrun", "_created"];
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
			case "customer":
				return ["name", "dbusage", "_created", "_modified"];
			case "credential":
				return ["name", "username", "_created", "_modified"];
			case "client":
				return ["id", "name", "clientagent", "clientversion", "_created", "remoteip"];
			case "auditlog":
				return ["_id", "name", "_type", "impostorname", "clientagent", "clientversion", "remoteip", "_created"];
			case "agent":
				return ["name", "image", "os", "stripeprice", "_createdby", "status"];
			case "package":
				return ["name", "language", "_createdby", "_created"];
			case "workspace":
				return ["name", "_created", "_modified"];
			case "member":
				return ["name", "status", "role", "_modified"];
			case "/workspace/invites":
			case "invites":
				return ["name", "workspacename", "status", "role"];
			case "workflow":
				return ["name", "_created"];
			case "rpaworkflow":
				return ["name", "_createdby", "_modified", "runtime"];
			default:
				return ["_id", "name", "_type", "_createdby", "_created"];
		}
	}
}

let defaultentitiesdata = new entitiesdata();
export const data = $state(defaultentitiesdata);