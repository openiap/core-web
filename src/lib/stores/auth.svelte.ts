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
            console.log("Creating new client");
            this.client = new openiap("wss://app.openiap.io/ws/v2", this.access_token);
            await this.client.connect(true);
            auth.isAuthenticated = true;
        }
        this.isLoaded = true;
    }
    loginCallbacks: any[]= [];
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