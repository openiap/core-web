import { usersettings, pagesettings, type pageSettings, type SettingsTableHeader } from "$lib/stores/usersettings.svelte.js";
import { auth } from "$lib/stores/auth.svelte";
import { X } from "lucide-svelte";
import { type sort } from "$lib/stores/usersettings.svelte";

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
	async GetData(page: string, collectionname: string, query: any) {
		data.loadsettings(page);
		let orderby = this.getOrderBy();
		let usequery = this.createQuery(this.settings.searchstring, query);
		let top = 5;
		let skip = this.settings.page_index * top;

		if (auth.isConnected == false) {
			return [];
		}
		const entities = await auth.client.Query<any>({
			collectionname: collectionname,
			query: usequery,
			orderby: orderby,
			skip: skip,
			top: 5,
			jwt: auth.access_token,
		});
		this.settings.total_count = await auth.client.Count({
			collectionname,
			query: usequery,
			jwt: auth.access_token,
		});
		console.log("GetData", page, "searchstring:", this.settings.searchstring, "col:", collectionname, "order:", orderby, "results", entities.length, "total_count:", this.settings.total_count);
		return entities;
	}
	persist() {
		usersettings.persist();
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
			// orderby["_id"] = -1;
			return "";
		}
		return orderby;

		// const orderby: { [key: string]: number } = {};
		// let ordered = tableheaders
		// 	.filter((x) => x.order != "")
		// 	.sort((a, b) => {
		// 		return a.orderindex - b.orderindex;
		// 	});
		// for (let i = 0; i < ordered.length; i++) {
		// 	const sortKey = ordered[i];
		// 	if (sortKey.order != null && sortKey.order != "") {
		// 		orderby[sortKey.field] = sortKey.order == "desc" ? -1 : 1;
		// 	}
		// }
		// if (Object.keys(orderby).length == 0) {
		// 	// orderby["_id"] = -1;
		// 	return "";
		// }
		// return orderby;
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

		// if (this.hide_empty_on_sort == true) {
		// 	let ordered = this.settings.tableheaders.filter(
		// 		(x) => x.order != "" && x.field != "_id",
		// 	);
		// 	if (ordered.length > 0) {
		// 		let ands: any = {};
		// 		for (let i = 0; i < ordered.length; i++) {
		// 			const field = ordered[i].field;
		// 			const or: any = {};
		// 			ands[field] = { $exists: true, $ne: null };
		// 		}
		// 		q = { $and: [ands, q] };
		// 	}
		// }

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
				return ["_id", "name", "rparole", "_created"];
			case "workitem":
				return ["_id", "name", "wiq", "_created"];
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
			// case "entities":
			// 	return ["_id", "name", "_type", "_createdby", "_modified", "_created" ];
			default:
				return ["_id", "name", "_type", "_createdby", "_created"];
		}
	}
}

let defaultentitiesdata = new entitiesdata();
export const data = $state(defaultentitiesdata);