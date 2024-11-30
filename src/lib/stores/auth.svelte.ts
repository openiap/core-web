import pkg from "oidc-client";
import { base } from "$app/paths";
const { UserManager, WebStorageStateStore } = pkg;
import { openiap } from "@openiap/jsapi";

const settings = {
    authority: "https://app.openiap.io/oidc",
    client_id: "webapp",
    redirect_uri: window.location.origin + base + "/",
    response_type: "code",
    scope: "openid profile email",
    post_logout_redirect_uri: window.location.origin + base + "/",
    userStore: new WebStorageStateStore({ store: window.localStorage }),
};

class authState {
    isAuthenticated: boolean = $state(false);
    profile: pkg.Profile = {} as any;
    access_token: string = "";
    client: openiap = {} as any;
    userManager = new UserManager(settings)
    isLoaded: boolean = $state(false);
    constructor() {
        this.loadUserAndClient()
    }
    async loadUserAndClient() {
        const result = await this.userManager.getUser();
        if (result != null) {
            auth.profile = result.profile;
            auth.access_token = result.access_token;
            auth.isAuthenticated = true;
            console.log("Creating new client");
            this.client = new openiap("wss://app.openiap.io/ws/v2", this.access_token);
            await this.client.connect(true);
        }
        this.isLoaded = true;
    }
    onLogin(callback: (user: pkg.Profile) => void) {
        let called = false;
        if (callback == null) return;
        if (this.isLoaded) {
            callback(this.profile);
            return;
        }
        $effect(() => {
            console.log("onLogin: Checking if loaded");
            if (this.isLoaded && called == false) {
                called = true;
                callback(this.profile);
            }
        });
    }
}

let defaultstate = new authState();
export const auth = $state(defaultstate);