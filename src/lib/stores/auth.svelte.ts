import pkg from "oidc-client";

import { browser } from '$app/environment';
import { base } from "$app/paths";
import { openiap } from "@openiap/jsapi";
import { SvelteStorage } from "./SvelteStorage.svelte";
const { UserManager, WebStorageStateStore } = pkg;
// @ts-ignore
import ws from 'ws';

export class Workspace {
    public _id: string = "";
    public name: string = "";
    public billingid: string = "";
    public admins: string = "";
    public users: string = "";
    public price: string = "";
}
class Config {
    wshost: string = "";
    wsurl: string = "";
    domain: string = "";
    auto_create_users: boolean = false;
    auto_create_personal_nodered_group: boolean = false;
    auto_create_personal_noderedapi_group: boolean = false;
    namespace: string = "";
    agent_domain_schema: string = "";
    websocket_package_size: number = 0;
    version: string = "";
    stripe_api_key: string = "";
    getting_started_url: string = "";
    validate_user_form: boolean = false;
    validate_emails: boolean = false;
    forgot_pass_emails: boolean = false;
    supports_watch: boolean = false;
    agent_images: any[] = [];
    amqp_enabled_exchange: string = "";
    multi_tenant: boolean = false;
    workspace_enabled: boolean = false;
    enable_entity_restriction: boolean = false;
    enable_web_tours: boolean = false;
    enable_nodered_tours: boolean = false;
    collections_with_text_index: string[] = [];
    timeseries_collections: string[] = [];
    ping_clients_interval: number = 0;
    validlicense: boolean = false;
    forceddomains: string[] = [];
    grafana_url: string = "";
    llmchat_queue: string = "";
    enable_analytics: boolean = false;
    enable_gitserver: boolean = false;
}
class authState {
    isAuthenticated: boolean = $state(false);
    profile: pkg.Profile = $state({}) as any;
    access_token: string = $state("");
    client: openiap = null as any;
    userManager: any;
    isConnected: boolean = $state(false);
    config: Config = null as any;
    workspace: Workspace = $state(new Workspace());
    baseurl = "";
    wsurl = "";
    domain = "";
    client_id = "";
    protocol = "";
    constructor() {
    }
    async getConfig(protocol: string, domain: string, fetch: any) {
        const configurl = protocol + '://' + domain + "/config";
        let f = await fetch(configurl);
        if (f.status !== 200) {
            throw new Error(`Failed to load config from ${configurl}`);
        }
        this.config = await f.json();
        this.baseurl = protocol + '://' + domain;
        this.wsurl = this.baseurl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/v2";
    }
    async serverinit(protocol: string, domain: string) {
        if (this.config == null) {
            await this.getConfig(protocol, domain, fetch);
        }
        if (this.client == null) {
            global.WebSocket = ws;
            this.client = new openiap(this.wsurl, "");
            await this.client.connect(true);
            this.client.onDisconnected = async () => {
                console.log("*********************************")
                console.log("serverinint.onDisconnected");
                console.log("*********************************")
                this.isConnected = false;
            }
            this.client.onConnected = async () => {
                console.log("*********************************")
                console.log("serverinint.onConnected");
                console.log("*********************************")
                this.isConnected = true;
            }
            this.isConnected = true;
        }
    }
    async serverloaduser(client_id: string, origin: string, cookies: any) {
        this.createuserManager(client_id, origin, cookies);
        return await this.loadUser();
    }
    async clientinit(protocol: string, domain: string, client_id: string, origin: string, access_token: string, profile: any, fetch: any, cookies: any) {
        if (this.config == null) await this.getConfig(protocol, domain, fetch);
        this.createuserManager(client_id, origin, cookies);

        if (access_token != null && access_token != "" && auth.access_token != access_token) {
            if (browser) this.access_token = access_token;
            this.profile = profile;
            auth.isAuthenticated = true;
        } else if (auth.access_token == null || auth.access_token == "") {
            access_token = await this.loadUser();
        } else {
            auth.isAuthenticated = true;
        }
        if (browser) {
            await this.connect(this.access_token);
        }
        try {
            if (this.client == null) return access_token;
            if (!this.client.connected) {
                return access_token;
            }
            let _workspace = await this.client.FindOne<Workspace>({ collectionname: "users", query: { _type: "workspace" }, jwt: auth.access_token });
            if (_workspace == null) {
                this.workspace = new Workspace();
            } else {
                this.workspace = _workspace;
            }
        } catch (error) {
            console.error("clientinit.FindOne.error", error);
        }
        return access_token;
    }
    async login() {
        if (this.userManager == null) throw new Error("UserManager not initialized");
        await this.userManager.signinRedirect();
    }
    async logout() {
        if (this.userManager == null) throw new Error("UserManager not initialized");
        await this.userManager.signoutRedirect();
    }
    async signinRedirectCallback() {
        try {
            const user = await auth.userManager.signinRedirectCallback();
            return true;
        } catch (error) {
            console.error("signinRedirectCallback.error", error);
        }
        return true;
    }
    async createuserManager(client_id: string, origin: string, cookies: any) {
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
    }
    async loadUser() {
        this.isAuthenticated = false;
        const result = await this.userManager.getUser();
        let access_token = "";
        if (result != null) {
            auth.profile = result.profile;
            access_token = result.access_token;
            if (browser) auth.access_token = result.access_token;
            auth.isAuthenticated = true;
        } else {
            auth.profile = {} as any;
            auth.access_token = "";
        }
        if (!browser) {
            global.WebSocket = ws;
        }
        return access_token;
    }
    connectWaitingPromisses: any[] = [];
    async connect(access_token: string) {
        if (this.client != null && this.client.connected) {
            return;
        }
        if (this.client == null) {
            this.client = new openiap(this.wsurl, access_token);
            const user = await this.client.connect(true);
            this.isConnected = true;
            this.connectWaitingPromisses.forEach((resolve: any) => {
                resolve();
            });
            if (browser) {
                this.client.Watch({ collectionname: "users", paths: ["$.[?(@ && @._type == 'workspace')]"], jwt: access_token }, async (operation: any, document: any) => {
                    if (document._type == "workspace") {
                        try {
                            let _workspace = await this.client.FindOne<Workspace>({ collectionname: "users", query: { _type: "workspace" } });
                            if (_workspace == null) {
                                this.workspace = new Workspace();
                            } else {
                                this.workspace = _workspace;
                            }
                        } catch (error) {
                            console.error("clientinit.Watch.error", error);
                        }
                    }
                });
            }
        } else {
            await new Promise((resolve) => {
                this.connectWaitingPromisses.push(resolve);
            });
        }
    }
}

let defaultstate = new authState();
export const auth = $state(defaultstate);