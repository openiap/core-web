import { browser } from "$app/environment";
import type { TTableHeader } from "$lib/entities/data.svelte";
import { object } from "zod";
import { auth } from "./auth.svelte";
export type sort = "asc" | "desc" | "";
export type SettingsTableHeader = {
	field: string;
	order: sort;
	orderindex: number;
}
export type pageSettings = {
    page: string;
    searchstring: string;
    selected_items: string[];
    headers: SettingsTableHeader[];
    page_index: number;
    total_count: number;
}
export type userSettings = {
    _id: string;
    _type: string;
    name: string;
    userid: string;
    entities_collectionname: string;
    pagesettings: pageSettings[];
    currentpage: string;
}
export class pagesettings implements pageSettings {
    page: string;
    searchstring: string;
    headers: SettingsTableHeader[];
    selected_items: string[];
    page_index: number;
    total_count: number;
    constructor(page: string) {
        this.page = page;
        this.searchstring = "";
        this.headers = [];
        this.selected_items = [];
        this.page_index = 0;
        this.total_count = 99999;
    }
}
class _usersettings implements userSettings {
    _id: string;
    _type: string;
    userid: string;
    name: string;
    entities_collectionname: string;
    pagesettings: pageSettings[] = $state([]);
    currentpage: string = "";
    constructor() {
        this._id = "";
        this._type = "usersettings";
        this.userid = "";
        this.name = "Unknown";
        this.entities_collectionname = "entities";
    }
    getpagesettings(page: string) {
        let settings = this.pagesettings.find(x => x.page == page);
        if (settings == null) {
            settings = new pagesettings(page);
            this.pagesettings = [...this.pagesettings, settings];
        }
        this.currentpage = page;
        return settings;
    }
    getpagesettingsreactless(page: string) {
        this.currentpage = page;
        return $state.snapshot(this.getpagesettings(page));
    }
    getpage() {
        return this.getpagesettings(this.currentpage);
    }
    async dbload() {
        let userid = auth.profile.sub;
        if (userid == null || userid == "") {
            return $state.snapshot(this);
        } else if (this.userid == userid) {
            // always load from db on server
            if (browser) {
                return $state.snapshot(this);
            }
        }
        let settings = await auth.client.FindOne<userSettings>({ collectionname: "users", query: { userid: userid, "_type": "usersettings" }, jwt: auth.access_token });
        if (settings == null) {
            this.userid = userid;
            this.name = "Settings for " + auth.profile.name;
            return $state.snapshot(this);
        }
        this.stateload(settings);
        return $state.snapshot(this);
    }
    async reset() {
        this.name = "Settings for " + auth.profile.name;
        this.entities_collectionname = "entities";
        this.pagesettings = [];
        this.dopersist();
    }
    loadpage(settings: pageSettings) {
        if(settings == null) return;
        let current = this.getpage();
        current.searchstring = settings.searchstring;
        current.selected_items = settings.selected_items;
        current.page_index = settings.page_index;
        current.headers = settings.headers;
        current.total_count = settings.total_count;
    }
    stateload(settings: userSettings) {
        if (settings == null) {
            this.name = "Settings for " + auth.profile.name;
            this.userid = auth.profile.sub;
            return;
        }
        this._id = settings._id;
        this.userid = settings.userid;
        this.name = settings.name;
        this.pagesettings = settings.pagesettings;
        for(let i = 0; i < this.pagesettings.length; i++) {
            const input = this.pagesettings[i];
            const defaultvalues = new pagesettings(input.page);
            const newpage = { ...defaultvalues, ...input };
            this.pagesettings[i] = newpage;
        }
        this.entities_collectionname = settings.entities_collectionname;
    }
    private persisttimer: NodeJS.Timeout | null = null;
    async persist() {
        if (!browser) return;
        if (this.persisttimer != null) {
            clearTimeout(this.persisttimer);
        }
        this.persisttimer = setTimeout(() => this.dopersist(), 1000);
    }
    private async dopersist() {
        this.persisttimer = null;
        if (this.userid == null || this.userid == "") {
            return;
        }
        let item = { ...this };
        // @ts-ignore
        delete item.pagesettings;
        item.pagesettings = [];
        for (let i = 0; i < this.pagesettings.length; i++) {
            let org = this.pagesettings[i];
            let page = {
                page: org.page,
                searchstring: org.searchstring,
                selected_items: org.selected_items,
                page_index: org.page_index,
                headers: org.headers,
                total_count: org.total_count
                // tableheaders: org.tableheaders,
                // page_index: $state.snapshot(org.page_index)
            };
            // @ts-ignore
            if(page.searchstring == "") delete page.searchstring;
            // @ts-ignore
            if(page.selected_items == null || page.selected_items.length == 0) delete page.selected_items;
            // @ts-ignore
            if(page.page_index == 0) delete page.page_index;
            // @ts-ignore
            if(page.headers == null || page.headers.length == 0) delete page.headers;
            if(page.headers != null && page.headers.length > 0) {
                let cleanheaders = [];
                for(let i = 0; i < page.headers.length; i++) {
                    let head = page.headers[i];
                    // @ts-ignore
                    if(head.order == "") delete head.order;
                    // @ts-ignore
                    if(head.orderindex == 0) delete head.orderindex;
                    cleanheaders.push(head);
                }
                page.headers = cleanheaders;
            }
            if(Object.keys(page).length == 1) continue;

            item.pagesettings.push(page);
        }
        // @ts-ignore
        delete item.persisttimer;
        let result = await auth.client.InsertOrUpdateOne<userSettings>({ collectionname: "users", item, uniqeness: "userid,_type", jwt: auth.access_token });
        console.log("Persisted user settings", result._id);
        this._id = result._id;
    }
}

let state = new _usersettings();
export const usersettings = $state(state);