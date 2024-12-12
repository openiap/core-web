import { usersettings, pagesettings, type pageSettings } from "$lib/stores/usersettings.svelte.js";
import { auth } from "$lib/stores/auth.svelte";
import { X } from "lucide-svelte";
export type sort = "asc" | "desc" | "";

export type TTableHeader = {
	name: string;
	field: string;
	headclass: string ;
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
	total_count = 0;
	errormessage = "";
	getHeaders() {
		return this.settings.tableheaders;
	}

	async GetData(page: string, collectionname: string, searchstring: string, query: any) {
		// this.loadsettings(page, null);
		this.EnsureDefaultHeaders(page);
		let orderby = this.getOrderBy();
		let usequery = this.createQuery(searchstring, query);
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
		if (entities.length > 0) {
			let keys = [];
			for (let i = 0; i < entities.length; i++) {
				let entity = entities[i];
				let subkeys = Object.keys(entity);
				for (let j = 0; j < subkeys.length; j++) {
					let key = subkeys[j];
					if (keys.indexOf(key) == -1) {
						keys.push(key);
					}
				}
			}
			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				if (this.settings.tableheaders.find((x) => x.field == key) == null) {
					let header = new TableHeader();
					header.field = key;
					header.name = key;
					header.show = false;
					this.settings.tableheaders.push(header);
				}
			}
			this.total_count = await auth.client.Count({
				collectionname,
				query: usequery,
				jwt: auth.access_token,
			});
		}
		return entities;
	}
	loadsettings(page: string, cookies: any) {
		this.settings = usersettings.getpagesettings(page);
		// this.settings.tableheaders = this.settings.tableheaders;
		// this.settings.page_index = this.settings.page_index;
	}
	SaveHeaders(page: string) {
		// let _headers = $state.snapshot(this.settings.tableheaders);
		// for (let i = 0; i < _headers.length; i++) {
		// 	_headers[i].show = $state.snapshot(this.settings.tableheaders[i].show);
		// }
		// this.settings.setvalue(page, "headers", _headers);
		usersettings.persist();
	}
	EnsureDefaultHeaders(page: string) {
		if (this.settings.tableheaders.length == 0) {
			const defaultcolumnnames = this.defaultcolumnnames(page);
			for (let i = 0; i < defaultcolumnnames.length; i++) {
				let header = new TableHeader();
				header.field = defaultcolumnnames[i];
				if (header.field == "_id") {
					header.show = false;
					header.order = "desc";
					header.orderindex = 100;
				}
				if (i == 0) {
					header.headclass = "w-[100px]";
					header.cellclass = "font-medium";
				}
				if (i == defaultcolumnnames.length - 1) {
					header.headclass = "text-right";
					header.cellclass = "text-right";
				}
				this.settings.tableheaders.push(header);
			}
		}
	}
	private getOrderBy() {
		const orderby: { [key: string]: number } = {};
		let ordered = this.settings.tableheaders
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

	private createQuery(searchstring: string, query: any) {
		let q: any = { ...query };

		if (this.hide_empty_on_sort == true) {
			let ordered = this.settings.tableheaders.filter(
				(x) => x.order != "" && x.field != "_id",
			);
			if (ordered.length > 0) {
				let ands: any = {};
				for (let i = 0; i < ordered.length; i++) {
					const field = ordered[i].field;
					const or: any = {};
					ands[field] = { $exists: true, $ne: null };
				}
				q = { $and: [ands, q] };
			}
		}

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
				return ["filename", "metadata.name", "length" ];
			case "customer":
				return ["name", "dbusage", "_created", "_modified"];
			case "credential":
				return ["name", "username", "_created", "_modified"];
			case "client":
				return ["name", "username", "clientagent", "clientversion", "created"];
			case "auditlog":
				return ["_id", "name", "_type", "impostorname", "clientagent", "clientversion", "remoteip", "_created"];
			case "agent":
				return ["name","image", "os", "stripeprice", "_createdby", "status" ];
			// case "entities":
			// 	return ["_id", "name", "_type", "_createdby", "_modified", "_created" ];
			default:
				return ["_id", "name", "_type", "_createdby", "_created"];
		}
	}
}

let defaultentitiesdata = new entitiesdata();
export const data = $state(defaultentitiesdata);