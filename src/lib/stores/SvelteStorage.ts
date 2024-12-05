import { CookieStorage } from 'cookie-storage';

export class SvelteStorage {
    cookies: any;
    storage: any;
    constructor(cookies:any) {
        this.cookies = cookies;
        if(this.cookies == null) {
            this.storage = new CookieStorage();
        }
    }
    getItem(key: string) {
        let urlencodedkey = encodeURIComponent(key);
        let item = (this.cookies ? this.cookies.get(urlencodedkey) : this.storage.getItem(key));
        console.log("getItem", key, item?.substring(0, 30));
        return item;
    }
    setItem(key: string, value: any) {
        console.log("setItem", key, value?.substring(0, 30));
        let urlencodedkey = encodeURIComponent(key);
        this.cookies ? this.cookies.set(urlencodedkey, value) : this.storage.setItem(key, value);
    }
    removeItem(key: string) {
        let urlencodedkey = encodeURIComponent(key);
        console.log("removeItem", key);
        this.cookies ? this.cookies.delete(urlencodedkey) : this.storage.removeItem(key);
    }
}