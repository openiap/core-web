import pkg from "oidc-client";

import { browser } from '$app/environment';
import { base } from "$app/paths";
import { openiap } from "@openiap/jsapi";
import { SvelteStorage } from "./SvelteStorage.svelte";
const { UserManager, WebStorageStateStore } = pkg;
// @ts-ignore
import ws from 'ws';
import posthog from "posthog-js";
import { ChevronsLeftRightEllipsisIcon, Cookie } from "lucide-svelte";
class Config {
    webversion: string = "";
    webcommit: string = "";
    wshost: string = "";
    wsurl: string = "";
    domain: string = "";
    auto_create_users: boolean = false;
    auto_create_personal_nodered_group: boolean = false;
    auto_create_personal_noderedapi_group: boolean = false;
    namespace: string = "";
    ofid: string = "";
    agent_domain_schema: string = "";
    websocket_package_size: number = 0;
    version: string = "";
    stripe_api_key: string = "";
    getting_started_url: string = "";
    validate_user_form: string = "";
    validate_emails: boolean = false;
    web_hide_general_info: boolean = false;
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
    enable_guest: boolean = false;
    otel_trace_url: string = "";
    otel_metric_url: string = "";
    otel_log_url: string = "";
    loginproviders: any[] = [];
}
class authState {
    isAuthenticated: boolean = $state(false);
    profile: pkg.Profile = $state({}) as any;
    access_token: string = $state("");
    client: openiap = null as any;
    userManager: any;
    isConnected: boolean = $state(false);
    config: Config = null as any;
    baseurl = "";
    domain = "";
    client_id = "";
    protocol = "";
    constructor() {
    }
    async getConfig(wsurl: string, fetch: any) {
        let url = new URL(wsurl);
        if (url.protocol == "wss:") url.protocol = "https:";
        if (url.protocol == "ws:") url.protocol = "http:";
        url.pathname = "/config";
        let configurl = url.toString();
        let f = await fetch(configurl);
        if (f.status !== 200) {
            throw new Error(`Failed to load config from ${configurl}`);
        }
        this.config = await f.json();
    }
    async serverinit(wsurl: string, protocol: string, domain: string) {
        this.baseurl = protocol + '://' + domain;
        if (this.config == null) {
            await this.getConfig(wsurl, fetch);
        }
        if (this.client == null) {
            global.WebSocket = ws;
            this.client = new openiap(wsurl, "");
            this.client.maxreconnectms = 1000;
            try {
                await this.client.connect(true);
                if(this.config.enable_guest) {
                    this.client.Signin({username: "guest", password: "guest"});
                }
                this.client.onDisconnected = async () => {
                    console.debug("**** serverinit.onDisconnected");
                    this.isConnected = false;
                }
                this.client.onConnected = async () => {
                    console.debug("**** serverinit.onConnected");
                    this.isConnected = true;
                }
                this.isConnected = true;
            } catch (error) {
                console.error("Failed to connect to server", error);
                this.isConnected = false;
                this.isAuthenticated = false;
            }
        }
    }
    async serverloaduser(client_id: string, origin: string, cookies: any) {
        this.createuserManager(client_id, origin, cookies);
        return await this.loadUser();
    }
    async clientinit(wsurl: string, protocol: string, domain: string, client_id: string, origin: string, access_token: string, profile: any, fetch: any, cookies: any) {
        if (this.config == null) await this.getConfig(wsurl, fetch);
        this.baseurl = protocol + '://' + domain;
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
            await this.connect(wsurl, this.access_token);
        }
        if (this.client == null) return access_token;
        if (!this.client.connected) {
            return access_token;
        }
        return access_token;
    }
    async login() {
        if (this.userManager == null) throw new Error("UserManager not initialized");
        if (browser) {
            document.cookie.split(";").forEach(function (cookie) {
                let eqPos = cookie.indexOf("=");
                let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=;"; // Handle cookies without paths
            });
        }
        await this.userManager.signinRedirect();
    }
    async logout() {
        if (this.userManager == null) throw new Error("UserManager not initialized");
        await this.userManager.signoutRedirect();
    }
    async signinRedirectCallback() {
        try {
            const user = await auth.userManager.signinRedirectCallback();
            this.profile = user.profile;
            return true;
        } catch (error) {
            console.error("Failed to signinRedirectCallback", error);
            return false;
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
            if (browser) {
                auth.access_token = result.access_token;
                try {
                    posthog.identify(auth.profile.sub, {
                        name: auth.profile.name,
                        email: auth.profile.email,
                    });
                } catch (error:any) {
                    console.error(error.message);
                }
            }
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
    async reloadUser() {
        if (this.client == null || !this.client.connected) {
            return;
        }
        if(this.profile != null && this.profile.sub != null && this.profile.sub != "") {
            const profile = await this.client.FindOne<any>({ collectionname: "users", query: { _id: this.profile.sub }, jwt: this.access_token });
            if(profile != null) {
                this.profile.formvalidated = profile.formvalidated;
                this.profile.emailvalidated = profile.emailvalidated;
                this.profile.validated = profile.validated;
                this.profile.name = profile.name;
                this.profile.email = profile.email;
                this.profile.company = profile.company;
            }
        }
    }
    async connect(wsurl: string, access_token: string) {
        if (this.client != null && this.client.connected) {
            return;
        }
        if (this.client == null) {
            try {
                this.client = new openiap(wsurl, "");
                if(wsurl.indexOf("demo.openiap.io") > -1 || wsurl.indexOf("dev.openiap.io") > -1 || wsurl.indexOf("home.openiap.io") > -1) {
                    this.client.maxreconnectms = 1000; // as a dev, i have no patience
                } else {
                    this.client.maxreconnectms = 5000; // default is 30 seconds, but we want to reconnect faster
                }
                this.client.onConnected = async () => {
                    this.isConnected = true;
                    this.connectWaitingPromisses.forEach((resolve: any) => {
                        resolve();
                    });
                    try {
                        if(access_token != null && access_token != "") {
                            const res = await this.client.Signin({jwt: access_token});
                            this.isAuthenticated = true;
                        } else {
                            if(this.config.enable_guest) {
                                this.client.Signin({username: "guest", password: "guest"});
                            }
                            this.isAuthenticated = false;
                        }
                        await this.reloadUser();
                    } catch (error:any) {
                        console.error("Failed to signin", error.message);
                        this.isAuthenticated = false;                        
                    }
                }
                await this.client.connect(true);
                // const user = await this.client.connect(true);
                // this.isConnected = true;
                // this.connectWaitingPromisses.forEach((resolve: any) => {
                //     resolve();
                // });
            } catch (error: any) {
                if (error.message.indexOf("due to missing jwt, and respond with error") > -1) {
                    // remove all cookies
                    if (browser) {
                        document.cookie.split(";").forEach(function (cookie) {
                            let eqPos = cookie.indexOf("=");
                            let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=;"; // Handle cookies without paths
                        });
                    }
                    console.error("Failed to connect to server", error.message);
                    this.isConnected = false;
                    this.isAuthenticated = false;
                } else {
                    console.error("Failed to connect to server", error.message);
                    this.isConnected = false;
                    this.isAuthenticated = false;
                }
            }
        } else {
            await new Promise((resolve) => {
                this.connectWaitingPromisses.push(resolve);
            });
        }
    }
    weburl(slug: string) {
        return "//" + this.config.agent_domain_schema.replace("$slug$", slug)
    }
}

let defaultstate = new authState();
export const auth = $state(defaultstate);