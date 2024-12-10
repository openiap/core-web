import { CookieStorage } from 'cookie-storage';

export class SvelteStorage {
    cookies: any;
    storage = new CookieStorage();
    constructor(cookies: any) {
        this.cookies = cookies;
        if (this.cookies == null) {
            this.storage = new CookieStorage();
        }
    }
    getItem(key: string) {
        let urlencodedkey = encodeURIComponent(key);
        let provider = "cookiestorage";
        if (this.cookies == null) {
            provider = "cookie";
        }
        let item = (this.cookies ? this.cookies.get(urlencodedkey) : this.storage.getItem(key));
        return item;
    }
    setItem(key: string, value: any) {
        let provider = "cookiestorage";
        if (this.cookies == null) provider = "cookie";
        let urlencodedkey = encodeURIComponent(key);
        this.cookies ? this.cookies.set(urlencodedkey, value) : this.storage.setItem(key, value);
    }
    removeItem(key: string) {
        let urlencodedkey = encodeURIComponent(key);
        let provider = "cookiestorage";
        if (this.cookies == null) provider = "cookie";
        this.cookies ? this.cookies.delete(urlencodedkey) : this.storage.removeItem(key);
    }
}