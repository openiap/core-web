import { CookieStorage } from 'cookie-storage';

export class SvelteStorage {
    cookies: any;
    storage = new CookieStorage();
    constructor(cookies:any) {
        this.cookies = cookies;
        // console.log("**** SvelteStorage", this.cookies);
        if(this.cookies == null) {
            this.storage = new CookieStorage();
        }
        if(cookies == null) console.log("!!!!!!!!!! cookies is null");
        if(cookies != null) console.log("********** cookies is not null");
    }
    getItem(key: string) {
        let urlencodedkey = encodeURIComponent(key);
        let provider = "cookiestorage";
        if( this.cookies == null ) {
            provider = "cookie";
        }
        let item = (this.cookies ? this.cookies.get(urlencodedkey) : this.storage.getItem(key));
        console.log("getItem", provider, key, item?.substring(0, 30));
        return item;
    }
    setItem(key: string, value: any) {
        let provider = "cookiestorage";
        if( this.cookies == null ) provider = "cookie";
        console.log("setItem", provider, key, value?.substring(0, 30));
        let urlencodedkey = encodeURIComponent(key);
        this.cookies ? this.cookies.set(urlencodedkey, value) : this.storage.setItem(key, value);
    }
    removeItem(key: string) {
        let urlencodedkey = encodeURIComponent(key);
        let provider = "cookiestorage";
        if( this.cookies == null ) provider = "cookie";
        console.log("removeItem", provider, key);
        this.cookies ? this.cookies.delete(urlencodedkey) : this.storage.removeItem(key);
    }
}