import { settingsState } from "$lib/stores/settings.svelte";
import { auth } from "$lib/stores/auth.svelte";
import { X } from "lucide-svelte";
export type sort = "asc" | "desc" | "";
export class TableHeader {
    name: string = "";
    field: string = "";
    headclass: string = "";
    cellclass: string = "";
    order: sort = "";
    orderindex: number = 0;
    show: boolean = $state(true);
}

class entitiesdata {
    headers: TableHeader[] = $state([]);
    errormessage = $state("");
    hide_empty_on_sort = $state(true);
    page_index = $state(0);
	total_count = $state(99999);

	settings: settingsState = null as any;

	getHeaders() {
		return $state.snapshot(data.headers);
	}

    async GetData(collectionname:string, searchstring:string, query: any) {
		let orderby = this.getOrderBy();
		let usequery = this.createQuery(searchstring, query);
		let top = 5;
		let skip = this.page_index * top;

		if (auth.isConnected == false) {
			console.log("auth.isConnected == false");
			return [];
		}
		console.debug("GetData: ", collectionname, usequery, orderby, skip, top);
		const entities = await auth.client.Query<any>({
			collectionname: collectionname,
			query: usequery,
			orderby: orderby,
			skip: skip,
			top: 5,
			jwt: auth.access_token,
		});
		console.debug("GetData: ", entities.length);
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
				if (data.headers.find((x) => x.field == key) == null) {
					let header = new TableHeader();
					header.field = key;
					header.name = key;
					header.show = false;
					data.headers.push(header);
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
    loadsettings(page: string, cookies:any) {
		this.settings = new settingsState(cookies);
        data.headers = this.settings.getvalue(page, "headers", []);
		// console.log("loadsettings", page, data.headers.length, data.headers.map((x) => x.field) );
        data.page_index = this.settings.getvalue(page, "page_index", 0);
        data.page_index = this.settings.getvalue(page, "page_index", 0);
    }
	SaveHeaders(page: string) {
		// console.log("SaveHeaders", page, data.headers.length, data.headers.map((x) => x.field) );
		let _headers = $state.snapshot(data.headers);
		for (let i = 0; i < _headers.length; i++) {
			_headers[i].show = $state.snapshot(data.headers[i].show);
		}
		// console.log("SaveHeadersTEST1", page, _headers, _headers.length, _headers.map((x) => x.field) );
		this.settings.setvalue(page, "headers", _headers);

		let test: any[] = this.settings.getvalue(page, "headers", []);
		// console.log("SaveHeadersTEST2", page, test, test.length, test.map((x) => x.field) );
	}
	private getOrderBy() {
		const orderby: { [key: string]: number } = {};
		let ordered = data.headers
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
				e.message += ` while parsing near "${
					start === 0 ? "" : "..."
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

    private createQuery(searchstring:string, query: any) {
		let q: any = { ...query };

		if (this.hide_empty_on_sort == true) {
			let ordered = data.headers.filter(
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
}

let defaultentitiesdata = new entitiesdata();
export const data = $state(defaultentitiesdata);