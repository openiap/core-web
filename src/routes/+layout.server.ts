import { auth } from "$lib/stores/auth.svelte";
/** @type {import('./$types').PageServerData} */
export async function load({url, fetch}) {
	auth.origin = url.origin;
	auth.baseurl = url.origin;
	let configurl = "/config";
	if (auth.origin.includes(":517") || auth.origin.includes(":417")) {
		auth.baseurl = "https://app.openiap.io";
		configurl = auth.baseurl + "/config";
	}
	auth.wsurl = auth.baseurl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/v2";
	try {
		let f = await fetch(configurl);
		if(f.status === 200) console.log("Loaded config from", configurl);
		if(f.status !== 200) {
			f = await fetch(auth.baseurl + "/config");
			if(f.status === 200) console.log("Loaded config from", auth.baseurl + "/config");
		}
		if(f.status !== 200) {
			f = await fetch("http://localhost:3000/config");
			if(f.status === 200) console.log("Loaded config from", "http://localhost:3000/config");
		}
		if(f.status !== 200) {
			throw new Error(`Failed to load config from ${configurl}`);
		}
		auth.config = await f.json();
	} catch (error) {
		console.error('Failed to load config', error);
	}
    return {
      config: auth.config,
	  origin: auth.origin,
	  baseurl: auth.baseurl,
	  wsurl: auth.wsurl
    };
  }