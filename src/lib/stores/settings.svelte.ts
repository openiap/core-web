const settingsCache: { [key: string]: any } = {};
class settingsState {
    isAuthenticated: boolean = $state(false);
    constructor() {
    }
    clearall() {
        if (typeof localStorage === 'undefined') return;
        for (const key in settingsCache) {
            if (settingsCache.hasOwnProperty(key)) {
                delete settingsCache[key];
                localStorage && localStorage.removeItem(key);
            }
        }
        var keys = Object.keys(localStorage);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].startsWith("sveltekit-")) {
                localStorage.removeItem(keys[i]);
            }
        }
    }
    clearvalue(page: string, key: string) {
        const fullKey = `${page}-${key}`;
        delete settingsCache[fullKey];
        if (typeof localStorage !== 'undefined') localStorage.removeItem(fullKey);
    }
    setvalue<T>(page: string, key: string, value: T) {
        const fullKey = `${page}-${key}`;
        settingsCache[fullKey] = value;
        if (typeof localStorage !== 'undefined') localStorage.setItem(fullKey, JSON.stringify(value));
    }
    getvalue<T>(page: string, key: string, defaultValue: T): T {
        const fullKey = `${page}-${key}`;
        if( settingsCache.hasOwnProperty(fullKey) ) {
            return JSON.parse(JSON.stringify(settingsCache[fullKey]));
        }
        if (typeof localStorage === 'undefined') return JSON.parse(JSON.stringify(defaultValue));   
        let value = localStorage.getItem(fullKey);
        if (value != null) {
            try {
                settingsCache[fullKey] = JSON.parse(value);
                return JSON.parse(JSON.stringify(settingsCache[fullKey]));
            } catch (error) {
                return JSON.parse(JSON.stringify(defaultValue));
            }
        } else {
            return JSON.parse(JSON.stringify(defaultValue));
        }
    }
}
let defaultsettings = new settingsState();
export const settings = $state(defaultsettings);