const settingsCache: { [key: string]: any } = {};
class settingsState {
    isAuthenticated: boolean = $state(false);
    constructor() {
    }
    clearvalue(page: string, key: string) {
        const fullKey = `${page}-${key}`;
        delete settingsCache[fullKey];
        localStorage && localStorage.removeItem(fullKey);
    }
    setvalue<T>(page: string, key: string, value: T) {
        const fullKey = `${page}-${key}`;
        settingsCache[fullKey] = value;
        localStorage && localStorage.setItem(fullKey, JSON.stringify(value));
    }
    getvalue<T>(page: string, key: string, defaultValue: T): T {
        const fullKey = `${page}-${key}`;
        if( settingsCache.hasOwnProperty(fullKey) ) {
            return JSON.parse(JSON.stringify(settingsCache[fullKey]));
        }
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