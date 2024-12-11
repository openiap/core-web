import { SvelteStorage } from "./SvelteStorage";

export class settingsState {
    storage: SvelteStorage;
    constructor(cookies: any = null) {
        this.storage = new SvelteStorage(cookies);        
    }
    clearall() {
        this.storage.clear();
    }
    clearvalue(page: string, key: string) {
        const fullKey = `${page}-${key}`;
        this.storage.removeItem(fullKey);"headers"
    }
    setvalue<T>(page: string, key: string, value: T) {
        const fullKey = `${page}-${key}`;
        let json = JSON.stringify(value);
        console.log("setvalue: ", fullKey, json);
        this.storage.setItem(fullKey, json);
    }
    getvalue<T>(page: string, key: string, defaultValue: T): T {
        const fullKey = `${page}-${key}`;
        let json = this.storage.getItem(fullKey, "");
        let value = defaultValue;
        if (json != "") {
            try {
                console.log("getvalue: ", fullKey, json);
                value = JSON.parse(JSON.stringify(JSON.parse(json)));
            } catch (error) {
                console. error("getvalue: ", fullKey, error);
                value = JSON.parse(JSON.stringify(defaultValue));
            }
        } else {
            value = JSON.parse(JSON.stringify(defaultValue));
        }
        if(json == null) {
            // console. debug("getvalue: ", fullKey, value);
            return value;
        }
        // console. debug("getvalue: ", fullKey, JSON.stringify(value).substring(0, 70));
        return value;
    }
}
