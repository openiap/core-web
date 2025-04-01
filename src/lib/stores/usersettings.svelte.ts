import { browser } from "$app/environment";
import { auth } from "./auth.svelte";
import posthog from "posthog-js";
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
}
export type userSettings = {
    _id: string;
    _type: string;
    name: string;
    userid: string;
    entities_collectionname: string;
    currentworkspace: string;
    pagesettings: pageSettings[];
    currentpage: string;
    pagesize: number;
    agentfilter: "all" | "daemon" | "pods" | "docker" | "assistant";
}
export class pagesettings implements pageSettings {
    page: string;
    searchstring: string;
    headers: SettingsTableHeader[];
    selected_items: string[];
    page_index: number;
    constructor(page: string) {
        this.page = page;
        this.searchstring = "";
        this.headers = [];
        this.selected_items = [];
        this.page_index = 0;
    }
}
class _usersettings implements userSettings {
    _id: string;
    _type: string;
    userid: string;
    name: string;
    entities_collectionname: string;
    currentworkspace: string = $state("");
    pagesettings: pageSettings[] = $state([]);
    currentpage: string = "";
    pagesize: number = $state(12);
    defaultpagesize: number = 12;
    agentfilter: "all" | "daemon" | "pods" | "docker" | "assistant" = "all";
    constructor() {
        this._id = "";
        this._type = "usersettings";
        this.userid = "";
        this.name = "Unknown";
        this.entities_collectionname = "entities";
        this.currentworkspace = "";
        this.pagesize = this.defaultpagesize;
        this.agentfilter = "all";
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
    async dbload(access_token: string) {
        this._id = "";
        this._type = "";
        this.userid = "";
        this.name = "";
        this.entities_collectionname = "";
        this.pagesettings = [];
        this.currentpage = "";
        this.agentfilter = "all";
        if (auth.profile.sub == null || auth.profile.sub == "") {
            this.currentworkspace = "";
            return $state.snapshot(this);
        }
        this.userid = auth.profile.sub;
        this.name = "Settings for " + auth.profile.name;
        if (auth.client != null && auth.client.connected) {
            let settings = await auth.client.FindOne<userSettings>({ collectionname: "users", query: { userid: this.userid, "_type": "usersettings" }, jwt: access_token });
            if (settings != null) {
                this.stateload(settings);
            } else {
                this.currentworkspace = "";
            }
        } else {
            this.currentworkspace = "";
        }
        return $state.snapshot(this);
    }
    async reset() {
        this.name = "Settings for " + auth.profile.name;
        this.entities_collectionname = "entities";
        this.currentworkspace = "";
        this.pagesettings = [];
        this.pagesize = this.defaultpagesize;
        this.agentfilter = "all";
        this.dopersist();
    }
    loadpage(settings: pageSettings) {
        if (settings == null) return;
        let current = this.getpage();
        current.searchstring = settings.searchstring;
        current.selected_items = settings.selected_items;
        current.page_index = settings.page_index;
        current.headers = settings.headers;
    }
    stateload(settings: userSettings) {
        if (settings == null) {
            this._id = "";
            this.name = "Settings for " + auth.profile.name;
            this.userid = auth.profile.sub;
            return;
        }
        this._id = settings._id;
        this.userid = settings.userid;
        this.name = settings.name;
        this.pagesettings = settings.pagesettings;
        this.pagesize;
        this.agentfilter = settings.agentfilter;
        // @ts-ignore
        if (this.agentfilter == null || this.agentfilter == "") {
            this.agentfilter = "all";
        }
        // @ts-ignore
        if (this.pagesize != null && this.pagesize != "") {
            this.pagesize = settings.pagesize;
        }
        else {
            this.pagesize = this.defaultpagesize;
        }
        for (let i = 0; i < this.pagesettings.length; i++) {
            const input = this.pagesettings[i];
            const defaultvalues = new pagesettings(input.page);
            const newpage = { ...defaultvalues, ...input };
            this.pagesettings[i] = newpage;
        }
        this.entities_collectionname = settings.entities_collectionname;
        this.currentworkspace = settings.currentworkspace;
        if(this.currentworkspace != null && this.currentworkspace != "") {
            try {
                posthog.group("workspace", this.currentworkspace);
            } catch (error) {
            }
        }
    }
    private persisttimer: NodeJS.Timeout | null = null;
    persist() {
        if (!browser) return;
        if (this.persisttimer != null) {
            clearTimeout(this.persisttimer);
        }
        this.persisttimer = setTimeout(async () => this.dopersist(), 1000);
    }
    async dopersist(access_token: string = "") {
        this.persisttimer = null;
        if (this.userid == null || this.userid == "") {
            return;
        }
        let item = { ...this };
        item._type = "usersettings";
        item.currentworkspace = this.currentworkspace;
        // @ts-ignore
        delete item.pagesettings;
        item.pagesize = $state.snapshot(this.pagesize);
        item.pagesettings = [];
        for (let i = 0; i < this.pagesettings.length; i++) {
            let org = this.pagesettings[i];
            let page = {
                page: org.page,
                searchstring: org.searchstring,
                selected_items: org.selected_items,
                page_index: org.page_index,
                headers: org.headers,
            };
            // @ts-ignore
            if (page.searchstring == "") delete page.searchstring;
            // @ts-ignore
            if (page.selected_items == null || page.selected_items.length == 0) delete page.selected_items;
            // @ts-ignore
            if (page.page_index == 0) delete page.page_index;
            // @ts-ignore
            if (page.headers == null || page.headers.length == 0) delete page.headers;
            if (page.headers != null && page.headers.length > 0) {
                let cleanheaders = [];
                for (let i = 0; i < page.headers.length; i++) {
                    let head = page.headers[i];
                    // @ts-ignore
                    if (head.order == "") delete head.order;
                    // @ts-ignore
                    if (head.orderindex == 0) delete head.orderindex;
                    cleanheaders.push(head);
                }
                page.headers = cleanheaders;
            }
            if (Object.keys(page).length == 1) continue;

            item.pagesettings.push(page);
        }
        // @ts-ignore
        delete item.persisttimer;
        delete (item as any)._id;
        if (access_token != null && access_token != "") {
            let result = await auth.client.InsertOrUpdateOne<userSettings>({ collectionname: "users", item, uniqeness: "userid,_type", jwt: access_token });
            this._id = result._id;
        } else {
            let result = await auth.client.InsertOrUpdateOne<userSettings>({ collectionname: "users", item, uniqeness: "userid,_type", jwt: auth.access_token });
            this._id = result._id;
        }
    }
}

let state = new _usersettings();
export const usersettings = $state(state);