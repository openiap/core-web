import { browser } from "$app/environment";
import type { TTableHeader } from "$lib/entities/data.svelte";
import { object } from "zod";
import { auth } from "./auth.svelte";

export type pageSettings = {
    page: string;
    searchstring: string;
    tableheaders: TTableHeader[];
    selected_items: string[];
    page_index: number;
}
export type userSettings = {
    _id: string;
    _type: string;
    name: string;
    userid: string;
    pagesettings: pageSettings[];
}
export class pagesettings implements pageSettings {
    page: string;   
    searchstring: string;
    tableheaders: TTableHeader[];
    selected_items: string[];
    page_index: number;
    constructor(page: string) {
        this.page = page;
        this.searchstring = "";
        this.tableheaders = [];
        this.selected_items = [];
        this.page_index = 0;
    }
}
class _usersettings implements userSettings {
    _id: string;
    _type: string;
    userid: string;
    name: string;
    pagesettings: pageSettings[];
    constructor() {
        this._id = "";
        this._type = "usersettings";
        this.userid = "";
        this.name = "Unknown";
        this.pagesettings = [];
    }
    getpagesettings(page: string) {
        let settings = this.pagesettings.find(x => x.page == page);
        if(settings == null) {
            settings = new pagesettings(page);
            this.pagesettings = [...this.pagesettings , settings];
        }
        return settings;
    }
    async dbload(msg:string) {
        let userid = auth.profile.sub;
        if (userid == null || userid == "") {
            return $state.snapshot(this);
        } else if(this.userid == userid) {
            return $state.snapshot(this);
        }
        let settings = await auth.client.FindOne<userSettings>({collectionname: "users",query: {userid: userid, "_type": "usersettings"}, jwt: auth.access_token});
        if(settings == null) {
            this.userid = userid;
            this.name = "Settings for " + auth.profile.name;
            return $state.snapshot(this);
        }
        this.stateload(msg, settings);
        return $state.snapshot(this);
    }
    stateload(msg:string, settings:userSettings) {
        if(settings == null) {
            this.name = "Settings for " + auth.profile.name;
            this.userid = auth.profile.sub;
            return;
        }
        this._id = settings._id;
        this.userid = settings.userid;
        this.name = settings.name;
        this.pagesettings = settings.pagesettings;
    }
    private persisttimer: NodeJS.Timeout | null = null;
    async persist() {        
        if(!browser) return;
        if(this.persisttimer != null) {
            clearTimeout(this.persisttimer);
        }
        this.persisttimer = setTimeout(()=> this.dopersist(), 1000);
    }
    private async dopersist() {
        this.persisttimer = null;
        if(this.userid == null || this.userid == "") {
            return;
        }
        let item = {...this};
        // @ts-ignore
        delete item.pagesettings;
        item.pagesettings = [];
        for(let i = 0; i < this.pagesettings.length; i++) {
            let org = this.pagesettings[i];
            let page = {
                page: org.page,
                searchstring: org.searchstring,
                tableheaders: org.tableheaders,
                selected_items: org.selected_items,
                page_index: org.page_index
                // page_index: $state.snapshot(org.page_index)
            };
            item.pagesettings.push(page);
        }
        // @ts-ignore
        delete item.persisttimer;
        if(this._id == null || this._id == "") {
            let result = await auth.client.InsertOrUpdateOne<userSettings>({collectionname: "users", item, uniqeness: "userid,_type", jwt: auth.access_token });
            this._id = result._id;
        } else {
            await auth.client.UpdateOne<userSettings>({collectionname: "users", item, jwt: auth.access_token});
        }
    }
}

let state = new _usersettings();
export const usersettings = $state(state);