import pkg from "oidc-client";
import { base } from "$app/paths";
import { page } from '$app/stores';
const { UserManager, WebStorageStateStore } = pkg;
import { browser } from '$app/environment';
import { openiap } from "@openiap/jsapi";






class authState {
    isAuthenticated: boolean = $state(false);
    profile: pkg.Profile = {} as any;
    access_token: string = "";
    client: openiap = {} as any;
    userManager: any;
    isLoaded: boolean = $state(false);
    config: any = $state({});
    baseurl = $state("");
    origin = $state("");
    wsurl = $state("");
    constructor() {
    }
    async clientinit() {
        if (browser) {
            const settings = {
                authority: this.baseurl + "/oidc",
                client_id: "webapp",
                redirect_uri: origin + base + "/",
                response_type: "code",
                scope: "openid profile email",
                post_logout_redirect_uri: origin + base + "/",
                userStore: new WebStorageStateStore({ store: window.localStorage }),
            };
            this.userManager = new UserManager(settings) as any;
            this.loadUserAndClient();
        }
    }
    async login() {
        await this.userManager.signinRedirect();
    }
    async logout() {
        await this.userManager.signoutRedirect();
    }
    async loadUserAndClient() {
        const result = await this.userManager.getUser();
        if (result != null) {
            auth.profile = result.profile;
            auth.access_token = result.access_token;
            console.debug("Creating new client for", this.wsurl);
            this.client = new openiap(this.wsurl, this.access_token);
            await this.client.connect(true);
            auth.isAuthenticated = true;
        }
        this.isLoaded = true;
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
        $effect(() => {
            if (this.isLoaded == true) {
                for (let i = this.loginCallbacks.length - 1; i >= 0; i--) {
                    this.loginCallbacks[i](this.profile);
                    this.loginCallbacks.splice(i, 1);
                }
            }

        });
    }
}

let defaultstate = new authState();
export const auth = $state(defaultstate);