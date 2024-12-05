import pkg from "oidc-client";

import { base } from "$app/paths";
const { UserManager, WebStorageStateStore } = pkg;
import { browser } from '$app/environment';
import { openiap } from "@openiap/jsapi";
import { SvelteStorage } from "./SvelteStorage";
// @ts-ignore
import ws from 'ws';

class authState {
    isAuthenticated: boolean = $state(false);
    profile: pkg.Profile = {} as any;
    access_token: string = "";
    client: openiap = {} as any;
    userManager: any;
    isLoaded: boolean = $state(false);
    isConnected: boolean = $state(false);
    config: any = $state(null);
    baseurl = $state("");
    origin = $state("");
    wsurl = $state("");
    constructor() {
    }
    async getConfig(origin: string, fetch: any) {
        this.origin = origin;
        this.baseurl = origin;
        let configurl = "/config";
        if (this.origin.includes(":517") || this.origin.includes(":417")) {
            this.baseurl = "https://dev.openiap.io";
            configurl = this.baseurl + "/config";
        }
        this.wsurl = this.baseurl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/v2";
        try {
            let f = await fetch(configurl);
            if (f.status === 200) console.log("Loaded config from", configurl);
            if (f.status !== 200) {
                f = await fetch(this.baseurl + "/config");
                if (f.status === 200) console.log("Loaded config from", this.baseurl + "/config");
            }
            if (f.status !== 200) {
                f = await fetch("http://localhost:3000/config");
                if (f.status === 200) console.log("Loaded config from", "http://localhost:3000/config");
            }
            if (f.status !== 200) {
                throw new Error(`Failed to load config from ${configurl}`);
            }
            this.config = await f.json();
        } catch (error) {
            console.error('Failed to load config', error);
        }
    }
    async clientinit(origin: string, fetch: any, cookies: any) {
        // if (browser) {
        if (this.config == null) await this.getConfig(origin, fetch);
        const settings = {
            authority: this.baseurl + "/oidc",
            client_id: "webapp",
            redirect_uri: origin + base + "/",
            response_type: "code",
            scope: "openid profile email",
            post_logout_redirect_uri: origin + base + "/",
            // userStore: new WebStorageStateStore({ store: window.localStorage }),
            userStore: new WebStorageStateStore({ store: new SvelteStorage(cookies) }),
        };
        this.userManager = new UserManager(settings) as any;

        await this.loadUserAndClient();
        // }
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
        const result = await this.userManager.getUser();
        if (result != null) {
            auth.profile = result.profile;
            auth.access_token = result.access_token;
            // if (!browser) {
            //     global.WebSocket = ws;
            //     await this.connect();
            // }
            auth.isAuthenticated = true;
        } else {
            auth.profile = {} as any;
            auth.access_token = "";
            console.debug("No user found");
        }
        this.isLoaded = true;
    }
    async connect() {
        console.debug("Creating new client for", this.wsurl);
        this.client = new openiap(this.wsurl, this.access_token);
        await this.client.connect(true);
        this.isConnected = true;
    }
    loginCallbacks: any[] = [];
    onLogin(callback: (user: pkg.Profile) => void) {
        if (callback == null) {
            return;
        }
        if (this.isLoaded == true) {
            callback(this.profile);
            return;
        }
        this.loginCallbacks.push(callback);
        // $effect(() => {
        //     if (this.isLoaded == true) {
        //         for (let i = this.loginCallbacks.length - 1; i >= 0; i--) {
        //             this.loginCallbacks[i](this.profile);
        //             this.loginCallbacks.splice(i, 1);
        //         }
        //     }

        // });
    }
}

let defaultstate = new authState();
export const auth = $state(defaultstate);