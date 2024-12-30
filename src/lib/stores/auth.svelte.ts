import pkg from "oidc-client";

import { browser } from '$app/environment';
import { base } from "$app/paths";
import { openiap } from "@openiap/jsapi";
import { SvelteStorage } from "./SvelteStorage";
const { UserManager, WebStorageStateStore } = pkg;
// @ts-ignore
import ws from 'ws';

class authState {
    isAuthenticated: boolean = $state(false);
    profile: pkg.Profile = {} as any;
    access_token: string = "";
    client: openiap = null as any;
    userManager: any;
    isConnected: boolean = $state(false);
    config: any = $state(null);
    baseurl = $state("");
    origin = $state("");
    wsurl = $state("");
    constructor() {
    }
    async getConfig(domain: string, origin: string, fetch: any) {
        this.origin = origin;
        this.baseurl = origin;
        let configurl = "/config";
        this.baseurl = "https://" + domain;
        configurl = this.baseurl + "/config";
        this.wsurl = this.baseurl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/v2";
        try {
            let f = await fetch(configurl);
            if (f.status !== 200) {
                f = await fetch(this.baseurl + "/config");
            }
            if (f.status !== 200) {
                f = await fetch("http://localhost:3000/config");
            }
            if (f.status !== 200) {
                throw new Error(`Failed to load config from ${configurl}`);
            }
            this.config = await f.json();
        } catch (error) {
            console .error('Failed to load config', error);
        }
    }
    async clientinit(domain: string, client_id: string, origin: string, fetch: any, cookies: any) {
        if (this.config == null) await this.getConfig(domain, origin, fetch);
        const settings = {
            authority: this.baseurl + "/oidc",
            client_id: client_id,
            redirect_uri: origin + base + "/",
            response_type: "code",
            scope: "openid profile email",
            post_logout_redirect_uri: origin + base + "/",
            // userStore: new WebStorageStateStore({ store: window.localStorage }),
            userStore: new WebStorageStateStore({ store: new SvelteStorage(cookies) }),
        };
        this.userManager = new UserManager(settings) as any;
        await this.loadUserAndClient();
    }
    async login() {
        if (this.userManager == null) throw new Error("UserManager not initialized");
        await this.userManager.signinRedirect();
    }
    async logout() {
        if (this.userManager == null) throw new Error("UserManager not initialized");
        await this.userManager.signoutRedirect();
    }
    async loadUserAndClient() {
        this.isAuthenticated = false;
        const result = await this.userManager.getUser();
        if (result != null) {
            auth.profile = result.profile;
            auth.access_token = result.access_token;
            auth.isAuthenticated = true;
        } else {
            auth.profile = {} as any;
            auth.access_token = "";
        }
        if (!browser) {
            global.WebSocket = ws;
        }
        await this.connect();
    }
    connectWaitingPromisses: any[] = [];
    async connect() {
        if(this.client != null && this.client.connected) {
            return;
        }
        if(this.client == null) {
            if(browser) {
                this.client = new openiap(this.wsurl, this.access_token);
            } else {
                this.client = new openiap(this.wsurl, "");
            }
            await this.client.connect(true);
            this.isConnected = true;
            this.connectWaitingPromisses.forEach((resolve: any) => {
                resolve();
            });
        } else {
            await new Promise((resolve) => {
                this.connectWaitingPromisses.push(resolve);
            });
        }
    }
}

let defaultstate = new authState();
export const auth = $state(defaultstate);