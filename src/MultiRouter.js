import {Router} from '../src/Router.js';

export class MultiRouter extends Router {	
	constructor({slug, routers}) {
		super(slug);
		this.routers = new Map(routers.map(x => [x.slug, x]));
	}
	async fetch_record(info) {
		let {name} = info;
		let labels = name.split('.');
		for (let i = labels.length-1; i >= 0; i--) {
			let router = this.routers.get(labels[i]); 
			if (router) {
				info.multi = name; // remember original name
				info.name = labels.slice(0, i).join('.'); // "a.b" in "a.b.$router.c.d" 
				return router.fetch_record(info);
			}
		}
	}
}