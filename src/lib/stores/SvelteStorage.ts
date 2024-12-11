import { CookieStorage } from '../cookie-storage';

export class SvelteStorage {
    private cookies: any;
    private storage = null as any;
    constructor(cookies: any) {
        this.cookies = cookies;
        if (this.cookies == null) {
            this.storage = new CookieStorage(); // {path: "/"}
        }
    }
    clear() {
        this.cookies ? this.cookies.clear() : this.storage.clear();
    }
    keys() {
        return this.cookies ? this.cookies.keys() : Object.keys(this.storage);
    }
    getItem(key: string, defaultvalue: string): string {
        let urlencodedkey = encodeURIComponent(key);
        let provider = "cookiestorage";
        if (this.cookies == null) {
            provider = "cookie";
        }
        let item = (this.cookies ? this.cookies.get(urlencodedkey) : this.storage.getItem(key));
        return item ? item : defaultvalue;
    }
    setItem(key: string, value: string): void {
        let provider = "cookiestorage";
        if (this.cookies == null) provider = "cookie";
        let urlencodedkey = encodeURIComponent(key);
        this.cookies ? this.cookies.set(urlencodedkey, value) : this.storage.setItem(key, value); // , {path: "/"}
    }
    removeItem(key: string): void {
        let urlencodedkey = encodeURIComponent(key);
        let provider = "cookiestorage";
        if (this.cookies == null) provider = "cookie";
        this.cookies ? this.cookies.delete(urlencodedkey) : this.storage.removeItem(key); // , {path: "/"}
    }
}