(()=>{"use strict";let e,t,a;let s=(e,...t)=>{let a=e;return t.length>0&&(a+=` :: ${JSON.stringify(t)}`),a};class r extends Error{details;constructor(e,t){super(s(e,t)),this.name=e,this.details=t}}let i=e=>new URL(String(e),location.href).href.replace(RegExp(`^${location.origin}`),""),n={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"serwist",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},c=e=>[n.prefix,e,n.suffix].filter(e=>e&&e.length>0).join("-"),o=e=>{for(let t of Object.keys(n))e(t)},l={updateDetails:e=>{o(t=>{let a=e[t];"string"==typeof a&&(n[t]=a)})},getGoogleAnalyticsName:e=>e||c(n.googleAnalytics),getPrecacheName:e=>e||c(n.precache),getRuntimeName:e=>e||c(n.runtime)};class h{promise;resolve;reject;constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}function u(e,t){let a=new URL(e);for(let e of t)a.searchParams.delete(e);return a.href}async function d(e,t,a,s){let r=u(t.url,a);if(t.url===r)return e.match(t,s);let i={...s,ignoreSearch:!0};for(let n of(await e.keys(t,i)))if(r===u(n.url,a))return e.match(n,s)}let f=new Set,m=async()=>{for(let e of f)await e()};function p(e){return new Promise(t=>setTimeout(t,e))}let w="-precache-",g=async(e,t=w)=>{let a=(await self.caches.keys()).filter(a=>a.includes(t)&&a.includes(self.registration.scope)&&a!==e);return await Promise.all(a.map(e=>self.caches.delete(e))),a},y=e=>{self.addEventListener("activate",t=>{t.waitUntil(g(l.getPrecacheName(e)).then(e=>{}))})},_=()=>{self.addEventListener("activate",()=>self.clients.claim())},b=(e,t)=>{let a=t();return e.waitUntil(a),a},v=(e,t)=>t.some(t=>e instanceof t),R=new WeakMap,q=new WeakMap,E=new WeakMap,D={get(e,t,a){if(e instanceof IDBTransaction){if("done"===t)return R.get(e);if("store"===t)return a.objectStoreNames[1]?void 0:a.objectStore(a.objectStoreNames[0])}return x(e[t])},set:(e,t,a)=>(e[t]=a,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function x(e){if(e instanceof IDBRequest)return function(e){let t=new Promise((t,a)=>{let s=()=>{e.removeEventListener("success",r),e.removeEventListener("error",i)},r=()=>{t(x(e.result)),s()},i=()=>{a(e.error),s()};e.addEventListener("success",r),e.addEventListener("error",i)});return E.set(t,e),t}(e);if(q.has(e))return q.get(e);let s=function(e){if("function"==typeof e)return(a||(a=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(S(this),t),x(this.request)}:function(...t){return x(e.apply(S(this),t))};return(e instanceof IDBTransaction&&function(e){if(R.has(e))return;let t=new Promise((t,a)=>{let s=()=>{e.removeEventListener("complete",r),e.removeEventListener("error",i),e.removeEventListener("abort",i)},r=()=>{t(),s()},i=()=>{a(e.error||new DOMException("AbortError","AbortError")),s()};e.addEventListener("complete",r),e.addEventListener("error",i),e.addEventListener("abort",i)});R.set(e,t)}(e),v(e,t||(t=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])))?new Proxy(e,D):e}(e);return s!==e&&(q.set(e,s),E.set(s,e)),s}let S=e=>E.get(e);function N(e,t,{blocked:a,upgrade:s,blocking:r,terminated:i}={}){let n=indexedDB.open(e,t),c=x(n);return s&&n.addEventListener("upgradeneeded",e=>{s(x(n.result),e.oldVersion,e.newVersion,x(n.transaction),e)}),a&&n.addEventListener("blocked",e=>a(e.oldVersion,e.newVersion,e)),c.then(e=>{i&&e.addEventListener("close",()=>i()),r&&e.addEventListener("versionchange",e=>r(e.oldVersion,e.newVersion,e))}).catch(()=>{}),c}let C=["get","getKey","getAll","getAllKeys","count"],P=["put","add","delete","clear"],T=new Map;function k(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&"string"==typeof t))return;if(T.get(t))return T.get(t);let a=t.replace(/FromIndex$/,""),s=t!==a,r=P.includes(a);if(!(a in(s?IDBIndex:IDBObjectStore).prototype)||!(r||C.includes(a)))return;let i=async function(e,...t){let i=this.transaction(e,r?"readwrite":"readonly"),n=i.store;return s&&(n=n.index(t.shift())),(await Promise.all([n[a](...t),r&&i.done]))[0]};return T.set(t,i),i}D=(e=>({...e,get:(t,a,s)=>k(t,a)||e.get(t,a,s),has:(t,a)=>!!k(t,a)||e.has(t,a)}))(D);let I=["continue","continuePrimaryKey","advance"],U={},L=new WeakMap,A=new WeakMap,O={get(e,t){if(!I.includes(t))return e[t];let a=U[t];return a||(a=U[t]=function(...e){L.set(this,A.get(this)[t](...e))}),a}};async function*M(...e){let t=this;if(t instanceof IDBCursor||(t=await t.openCursor(...e)),!t)return;let a=new Proxy(t,O);for(A.set(a,t),E.set(a,S(t));t;)yield a,t=await (L.get(a)||t.continue()),L.delete(a)}function B(e,t){return t===Symbol.asyncIterator&&v(e,[IDBIndex,IDBObjectStore,IDBCursor])||"iterate"===t&&v(e,[IDBIndex,IDBObjectStore])}D=(e=>({...e,get:(t,a,s)=>B(t,a)?M:e.get(t,a,s),has:(t,a)=>B(t,a)||e.has(t,a)}))(D);let F=e=>e&&"object"==typeof e?e:{handle:e};class K{handler;match;method;catchHandler;constructor(e,t,a="GET"){this.handler=F(t),this.match=e,this.method=a}setCatchHandler(e){this.catchHandler=F(e)}}class j extends K{_allowlist;_denylist;constructor(e,{allowlist:t=[/./],denylist:a=[]}={}){super(e=>this._match(e),e),this._allowlist=t,this._denylist=a}_match({url:e,request:t}){if(t&&"navigate"!==t.mode)return!1;let a=e.pathname+e.search;for(let e of this._denylist)if(e.test(a))return!1;return!!this._allowlist.some(e=>e.test(a))}}let W=(e,t=[])=>{for(let a of[...e.searchParams.keys()])t.some(e=>e.test(a))&&e.searchParams.delete(a);return e};class $ extends K{constructor(e,t,a){super(({url:t})=>{let a=e.exec(t.href);if(a&&(t.origin===location.origin||0===a.index))return a.slice(1)},t,a)}}let H=async(e,t,a)=>{let s=t.map((e,t)=>({index:t,item:e})),r=async e=>{let t=[];for(;;){let r=s.pop();if(!r)return e(t);let i=await a(r.item);t.push({result:i,index:r.index})}},i=Array.from({length:e},()=>new Promise(r));return(await Promise.all(i)).flat().sort((e,t)=>e.index<t.index?-1:1).map(e=>e.result)},V=()=>{self.__WB_DISABLE_DEV_LOGS=!0};function G(e){return"string"==typeof e?new Request(e):e}class Q{event;request;url;params;_cacheKeys={};_strategy;_handlerDeferred;_extendLifetimePromises;_plugins;_pluginStateMap;constructor(e,t){for(let a of(this.event=t.event,this.request=t.request,t.url&&(this.url=t.url,this.params=t.params),this._strategy=e,this._handlerDeferred=new h,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map,this._plugins))this._pluginStateMap.set(a,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){let{event:t}=this,a=G(e),s=await this.getPreloadResponse();if(s)return s;let i=this.hasCallback("fetchDidFail")?a.clone():null;try{for(let e of this.iterateCallbacks("requestWillFetch"))a=await e({request:a.clone(),event:t})}catch(e){if(e instanceof Error)throw new r("plugin-error-request-will-fetch",{thrownErrorMessage:e.message})}let n=a.clone();try{let e;for(let s of(e=await fetch(a,"navigate"===a.mode?void 0:this._strategy.fetchOptions),this.iterateCallbacks("fetchDidSucceed")))e=await s({event:t,request:n,response:e});return e}catch(e){throw i&&await this.runCallbacks("fetchDidFail",{error:e,event:t,originalRequest:i.clone(),request:n.clone()}),e}}async fetchAndCachePut(e){let t=await this.fetch(e),a=t.clone();return this.waitUntil(this.cachePut(e,a)),t}async cacheMatch(e){let t;let a=G(e),{cacheName:s,matchOptions:r}=this._strategy,i=await this.getCacheKey(a,"read"),n={...r,cacheName:s};for(let e of(t=await caches.match(i,n),this.iterateCallbacks("cachedResponseWillBeUsed")))t=await e({cacheName:s,matchOptions:r,cachedResponse:t,request:i,event:this.event})||void 0;return t}async cachePut(e,t){let a=G(e);await p(0);let s=await this.getCacheKey(a,"write");if(!t)throw new r("cache-put-with-no-response",{url:i(s.url)});let n=await this._ensureResponseSafeToCache(t);if(!n)return!1;let{cacheName:c,matchOptions:o}=this._strategy,l=await self.caches.open(c),h=this.hasCallback("cacheDidUpdate"),u=h?await d(l,s.clone(),["__WB_REVISION__"],o):null;try{await l.put(s,h?n.clone():n)}catch(e){if(e instanceof Error)throw"QuotaExceededError"===e.name&&await m(),e}for(let e of this.iterateCallbacks("cacheDidUpdate"))await e({cacheName:c,oldResponse:u,newResponse:n.clone(),request:s,event:this.event});return!0}async getCacheKey(e,t){let a=`${e.url} | ${t}`;if(!this._cacheKeys[a]){let s=e;for(let e of this.iterateCallbacks("cacheKeyWillBeUsed"))s=G(await e({mode:t,request:s,event:this.event,params:this.params}));this._cacheKeys[a]=s}return this._cacheKeys[a]}hasCallback(e){for(let t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(let a of this.iterateCallbacks(e))await a(t)}*iterateCallbacks(e){for(let t of this._strategy.plugins)if("function"==typeof t[e]){let a=this._pluginStateMap.get(t),s=s=>{let r={...s,state:a};return t[e](r)};yield s}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async getPreloadResponse(){if(this.event instanceof FetchEvent&&"navigate"===this.event.request.mode&&"preloadResponse"in this.event)try{let e=await this.event.preloadResponse;if(e)return e}catch(e){}}async _ensureResponseSafeToCache(e){let t=e,a=!1;for(let e of this.iterateCallbacks("cacheWillUpdate"))if(t=await e({request:this.request,response:t,event:this.event})||void 0,a=!0,!t)break;return!a&&t&&200!==t.status&&(t=void 0),t}}class z{cacheName;plugins;fetchOptions;matchOptions;constructor(e={}){this.cacheName=l.getRuntimeName(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){let[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});let t=e.event,a="string"==typeof e.request?new Request(e.request):e.request,s=new Q(this,e.url?{event:t,request:a,url:e.url,params:e.params}:{event:t,request:a}),r=this._getResponse(s,a,t),i=this._awaitComplete(r,s,a,t);return[r,i]}async _getResponse(e,t,a){let s;await e.runCallbacks("handlerWillStart",{event:a,request:t});try{if(s=await this._handle(t,e),void 0===s||"error"===s.type)throw new r("no-response",{url:t.url})}catch(r){if(r instanceof Error){for(let i of e.iterateCallbacks("handlerDidError"))if(void 0!==(s=await i({error:r,event:a,request:t})))break}if(!s)throw r}for(let r of e.iterateCallbacks("handlerWillRespond"))s=await r({event:a,request:t,response:s});return s}async _awaitComplete(e,t,a,s){let r,i;try{r=await e}catch(e){}try{await t.runCallbacks("handlerDidRespond",{event:s,request:a,response:r}),await t.doneWaiting()}catch(e){e instanceof Error&&(i=e)}if(await t.runCallbacks("handlerDidComplete",{event:s,request:a,response:r,error:i}),t.destroy(),i)throw i}}let J={cacheWillUpdate:async({response:e})=>200===e.status||0===e.status?e:null};class Y extends z{_networkTimeoutSeconds;constructor(e={}){super(e),this.plugins.some(e=>"cacheWillUpdate"in e)||this.plugins.unshift(J),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,t){let a;let s=[],i=[];if(this._networkTimeoutSeconds){let{id:r,promise:n}=this._getTimeoutPromise({request:e,logs:s,handler:t});a=r,i.push(n)}let n=this._getNetworkPromise({timeoutId:a,request:e,logs:s,handler:t});i.push(n);let c=await t.waitUntil((async()=>await t.waitUntil(Promise.race(i))||await n)());if(!c)throw new r("no-response",{url:e.url});return c}_getTimeoutPromise({request:e,logs:t,handler:a}){let s;return{promise:new Promise(t=>{s=setTimeout(async()=>{t(await a.cacheMatch(e))},1e3*this._networkTimeoutSeconds)}),id:s}}async _getNetworkPromise({timeoutId:e,request:t,logs:a,handler:s}){let r,i;try{i=await s.fetchAndCachePut(t)}catch(e){e instanceof Error&&(r=e)}return e&&clearTimeout(e),(r||!i)&&(i=await s.cacheMatch(t)),i}}class X extends z{_networkTimeoutSeconds;constructor(e={}){super(e),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,t){let a,s;try{let s=[t.fetch(e)];if(this._networkTimeoutSeconds){let e=p(1e3*this._networkTimeoutSeconds);s.push(e)}if(!(a=await Promise.race(s)))throw Error(`Timed out the network response after ${this._networkTimeoutSeconds} seconds.`)}catch(e){e instanceof Error&&(s=e)}if(!a)throw new r("no-response",{url:e.url,error:s});return a}}let Z="requests",ee="queueName";class et{_db=null;async addEntry(e){let t=(await this.getDb()).transaction(Z,"readwrite",{durability:"relaxed"});await t.store.add(e),await t.done}async getFirstEntryId(){let e=await this.getDb(),t=await e.transaction(Z).store.openCursor();return t?.value.id}async getAllEntriesByQueueName(e){let t=await this.getDb();return await t.getAllFromIndex(Z,ee,IDBKeyRange.only(e))||[]}async getEntryCountByQueueName(e){return(await this.getDb()).countFromIndex(Z,ee,IDBKeyRange.only(e))}async deleteEntry(e){let t=await this.getDb();await t.delete(Z,e)}async getFirstEntryByQueueName(e){return await this.getEndEntryFromIndex(IDBKeyRange.only(e),"next")}async getLastEntryByQueueName(e){return await this.getEndEntryFromIndex(IDBKeyRange.only(e),"prev")}async getEndEntryFromIndex(e,t){let a=await this.getDb(),s=await a.transaction(Z).store.index(ee).openCursor(e,t);return s?.value}async getDb(){return this._db||(this._db=await N("serwist-background-sync",3,{upgrade:this._upgradeDb})),this._db}_upgradeDb(e,t){t>0&&t<3&&e.objectStoreNames.contains(Z)&&e.deleteObjectStore(Z),e.createObjectStore(Z,{autoIncrement:!0,keyPath:"id"}).createIndex(ee,ee,{unique:!1})}}class ea{_queueName;_queueDb;constructor(e){this._queueName=e,this._queueDb=new et}async pushEntry(e){delete e.id,e.queueName=this._queueName,await this._queueDb.addEntry(e)}async unshiftEntry(e){let t=await this._queueDb.getFirstEntryId();t?e.id=t-1:delete e.id,e.queueName=this._queueName,await this._queueDb.addEntry(e)}async popEntry(){return this._removeEntry(await this._queueDb.getLastEntryByQueueName(this._queueName))}async shiftEntry(){return this._removeEntry(await this._queueDb.getFirstEntryByQueueName(this._queueName))}async getAll(){return await this._queueDb.getAllEntriesByQueueName(this._queueName)}async size(){return await this._queueDb.getEntryCountByQueueName(this._queueName)}async deleteEntry(e){await this._queueDb.deleteEntry(e)}async _removeEntry(e){return e&&await this.deleteEntry(e.id),e}}let es=["method","referrer","referrerPolicy","mode","credentials","cache","redirect","integrity","keepalive"];class er{_requestData;static async fromRequest(e){let t={url:e.url,headers:{}};for(let a of("GET"!==e.method&&(t.body=await e.clone().arrayBuffer()),e.headers.forEach((e,a)=>{t.headers[a]=e}),es))void 0!==e[a]&&(t[a]=e[a]);return new er(t)}constructor(e){"navigate"===e.mode&&(e.mode="same-origin"),this._requestData=e}toObject(){let e=Object.assign({},this._requestData);return e.headers=Object.assign({},this._requestData.headers),e.body&&(e.body=e.body.slice(0)),e}toRequest(){return new Request(this._requestData.url,this._requestData)}clone(){return new er(this.toObject())}}let ei="serwist-background-sync",en=new Set,ec=e=>{let t={request:new er(e.requestData).toRequest(),timestamp:e.timestamp};return e.metadata&&(t.metadata=e.metadata),t};class eo{_name;_onSync;_maxRetentionTime;_queueStore;_forceSyncFallback;_syncInProgress=!1;_requestsAddedDuringSync=!1;constructor(e,{forceSyncFallback:t,onSync:a,maxRetentionTime:s}={}){if(en.has(e))throw new r("duplicate-queue-name",{name:e});en.add(e),this._name=e,this._onSync=a||this.replayRequests,this._maxRetentionTime=s||10080,this._forceSyncFallback=!!t,this._queueStore=new ea(this._name),this._addSyncListener()}get name(){return this._name}async pushRequest(e){await this._addRequest(e,"push")}async unshiftRequest(e){await this._addRequest(e,"unshift")}async popRequest(){return this._removeRequest("pop")}async shiftRequest(){return this._removeRequest("shift")}async getAll(){let e=await this._queueStore.getAll(),t=Date.now(),a=[];for(let s of e){let e=6e4*this._maxRetentionTime;t-s.timestamp>e?await this._queueStore.deleteEntry(s.id):a.push(ec(s))}return a}async size(){return await this._queueStore.size()}async _addRequest({request:e,metadata:t,timestamp:a=Date.now()},s){let r={requestData:(await er.fromRequest(e.clone())).toObject(),timestamp:a};switch(t&&(r.metadata=t),s){case"push":await this._queueStore.pushEntry(r);break;case"unshift":await this._queueStore.unshiftEntry(r)}this._syncInProgress?this._requestsAddedDuringSync=!0:await this.registerSync()}async _removeRequest(e){let t;let a=Date.now();switch(e){case"pop":t=await this._queueStore.popEntry();break;case"shift":t=await this._queueStore.shiftEntry()}if(t){let s=6e4*this._maxRetentionTime;return a-t.timestamp>s?this._removeRequest(e):ec(t)}}async replayRequests(){let e;for(;e=await this.shiftRequest();)try{await fetch(e.request.clone())}catch(t){throw await this.unshiftRequest(e),new r("queue-replay-failed",{name:this._name})}}async registerSync(){if("sync"in self.registration&&!this._forceSyncFallback)try{await self.registration.sync.register(`${ei}:${this._name}`)}catch(e){}}_addSyncListener(){"sync"in self.registration&&!this._forceSyncFallback?self.addEventListener("sync",e=>{if(e.tag===`${ei}:${this._name}`){let t=async()=>{let t;this._syncInProgress=!0;try{await this._onSync({queue:this})}catch(e){if(e instanceof Error)throw e}finally{this._requestsAddedDuringSync&&!(t&&!e.lastChance)&&await this.registerSync(),this._syncInProgress=!1,this._requestsAddedDuringSync=!1}};e.waitUntil(t())}}):this._onSync({queue:this})}static get _queueNames(){return en}}class el{_queue;constructor(e,t){this._queue=new eo(e,t)}async fetchDidFail({request:e}){await this._queue.pushRequest({request:e})}}let eh=async(t,a)=>{let s=null;if(t.url&&(s=new URL(t.url).origin),s!==self.location.origin)throw new r("cross-origin-copy-response",{origin:s});let i=t.clone(),n={headers:new Headers(i.headers),status:i.status,statusText:i.statusText},c=a?a(n):n,o=!function(){if(void 0===e){let t=new Response("");if("body"in t)try{new Response(t.body),e=!0}catch(t){e=!1}e=!1}return e}()?await i.blob():i.body;return new Response(o,c)};class eu extends z{_fallbackToNetwork;static defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e};static copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:e})=>e.redirected?await eh(e):e};constructor(e={}){e.cacheName=l.getPrecacheName(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(eu.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){let a=await t.getPreloadResponse();if(a)return a;let s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,t){let a;let s=t.params||{};if(this._fallbackToNetwork){let r=s.integrity,i=e.integrity,n=!i||i===r;a=await t.fetch(new Request(e,{integrity:"no-cors"!==e.mode?i||r:void 0})),r&&n&&"no-cors"!==e.mode&&(this._useDefaultCacheabilityPluginIfNeeded(),await t.cachePut(e,a.clone()))}else throw new r("missing-precache-entry",{cacheName:this.cacheName,url:e.url});return a}async _handleInstall(e,t){this._useDefaultCacheabilityPluginIfNeeded();let a=await t.fetch(e);if(!await t.cachePut(e,a.clone()))throw new r("bad-precaching-response",{url:e.url,status:a.status});return a}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(let[a,s]of this.plugins.entries())s!==eu.copyRedirectedCacheableResponsesPlugin&&(s===eu.defaultPrecacheCacheabilityPlugin&&(e=a),s.cacheWillUpdate&&t++);0===t?this.plugins.push(eu.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}let ed=()=>!!self.registration?.navigationPreload,ef=e=>{ed()&&self.addEventListener("activate",t=>{t.waitUntil(self.registration.navigationPreload.enable().then(()=>{e&&self.registration.navigationPreload.setHeaderValue(e)}))})},em=e=>{l.updateDetails(e)};class ep{updatedURLs=[];notUpdatedURLs=[];handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)};cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:a})=>{if("install"===e.type&&t?.originalRequest&&t.originalRequest instanceof Request){let e=t.originalRequest.url;a?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return a}}let ew=e=>{if(!e)throw new r("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){let t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}let{revision:t,url:a}=e;if(!a)throw new r("add-to-cache-list-unexpected-type",{entry:e});if(!t){let e=new URL(a,location.href);return{cacheKey:e.href,url:e.href}}let s=new URL(a,location.href),i=new URL(a,location.href);return s.searchParams.set("__WB_REVISION__",t),{cacheKey:s.href,url:i.href}},eg=(e,t,a)=>{if("string"==typeof e){let s=new URL(e,location.href);return new K(({url:e})=>e.href===s.href,t,a)}if(e instanceof RegExp)return new $(e,t,a);if("function"==typeof e)return new K(e,t,a);if(e instanceof K)return e;throw new r("unsupported-route-type",{moduleName:"serwist",funcName:"parseRoute",paramName:"capture"})};class ey extends K{constructor(e,t){super(({request:a})=>{let s=e.getUrlsToPrecacheKeys();for(let r of function*(e,{directoryIndex:t="index.html",ignoreURLParametersMatching:a=[/^utm_/,/^fbclid$/],cleanURLs:s=!0,urlManipulation:r}={}){let i=new URL(e,location.href);i.hash="",yield i.href;let n=W(i,a);if(yield n.href,t&&n.pathname.endsWith("/")){let e=new URL(n.href);e.pathname+=t,yield e.href}if(s){let e=new URL(n.href);e.pathname+=".html",yield e.href}if(r)for(let e of r({url:i}))yield e.href}(a.url,t)){let t=s.get(r);if(t){let a=e.getIntegrityForPrecacheKey(t);return{cacheKey:t,integrity:a}}}},e.precacheStrategy)}}let e_="www.google-analytics.com",eb="www.googletagmanager.com",ev=/^\/(\w+\/)?collect/,eR=e=>async({queue:t})=>{let a;for(;a=await t.shiftRequest();){let{request:s,timestamp:r}=a,i=new URL(s.url);try{let t="POST"===s.method?new URLSearchParams(await s.clone().text()):i.searchParams,a=r-(Number(t.get("qt"))||0),n=Date.now()-a;if(t.set("qt",String(n)),e.parameterOverrides)for(let a of Object.keys(e.parameterOverrides)){let s=e.parameterOverrides[a];t.set(a,s)}"function"==typeof e.hitFilter&&e.hitFilter.call(null,t),await fetch(new Request(i.origin+i.pathname,{body:t.toString(),method:"POST",mode:"cors",credentials:"omit",headers:{"Content-Type":"text/plain"}}))}catch(e){throw await t.unshiftRequest(a),e}}},eq=e=>{let t=({url:e})=>e.hostname===e_&&ev.test(e.pathname),a=new X({plugins:[e]});return[new K(t,a,"GET"),new K(t,a,"POST")]},eE=e=>new K(({url:e})=>e.hostname===e_&&"/analytics.js"===e.pathname,new Y({cacheName:e}),"GET"),eD=e=>new K(({url:e})=>e.hostname===eb&&"/gtag/js"===e.pathname,new Y({cacheName:e}),"GET"),ex=e=>new K(({url:e})=>e.hostname===eb&&"/gtm.js"===e.pathname,new Y({cacheName:e}),"GET"),eS=({serwist:e,cacheName:t,...a})=>{let s=l.getGoogleAnalyticsName(t),r=new el("serwist-google-analytics",{maxRetentionTime:2880,onSync:eR(a)});for(let t of[ex(s),eE(s),eD(s),...eq(r)])e.registerRoute(t)};class eN{_fallbackUrls;_serwist;constructor({fallbackUrls:e,serwist:t}){this._fallbackUrls=e,this._serwist=t}async handlerDidError(e){for(let t of this._fallbackUrls)if("string"==typeof t){let e=await this._serwist.matchPrecache(t);if(void 0!==e)return e}else if(t.matcher(e)){let e=await this._serwist.matchPrecache(t.url);if(void 0!==e)return e}}}class eC{_precacheController;constructor({precacheController:e}){this._precacheController=e}cacheKeyWillBeUsed=async({request:e,params:t})=>{let a=t?.cacheKey||this._precacheController.getPrecacheKeyForUrl(e.url);return a?new Request(a,{headers:e.headers}):e}}let eP=(e,t={})=>{let{cacheName:a,plugins:s=[],fetchOptions:r,matchOptions:i,fallbackToNetwork:n,directoryIndex:c,ignoreURLParametersMatching:o,cleanURLs:h,urlManipulation:u,cleanupOutdatedCaches:d,concurrency:f=10,navigateFallback:m,navigateFallbackAllowlist:p,navigateFallbackDenylist:w}=t??{};return{precacheStrategyOptions:{cacheName:l.getPrecacheName(a),plugins:[...s,new eC({precacheController:e})],fetchOptions:r,matchOptions:i,fallbackToNetwork:n},precacheRouteOptions:{directoryIndex:c,ignoreURLParametersMatching:o,cleanURLs:h,urlManipulation:u},precacheMiscOptions:{cleanupOutdatedCaches:d,concurrency:f,navigateFallback:m,navigateFallbackAllowlist:p,navigateFallbackDenylist:w}}};class eT{_urlsToCacheKeys=new Map;_urlsToCacheModes=new Map;_cacheKeysToIntegrities=new Map;_concurrentPrecaching;_precacheStrategy;_routes;_defaultHandlerMap;_catchHandler;constructor({precacheEntries:e,precacheOptions:t,skipWaiting:a=!1,importScripts:s,navigationPreload:r=!1,cacheId:i,clientsClaim:n=!1,runtimeCaching:c,offlineAnalyticsConfig:o,disableDevLogs:l=!1,fallbacks:h}={}){let{precacheStrategyOptions:u,precacheRouteOptions:d,precacheMiscOptions:f}=eP(this,t);if(this._concurrentPrecaching=f.concurrency,this._precacheStrategy=new eu(u),this._routes=new Map,this._defaultHandlerMap=new Map,this.handleInstall=this.handleInstall.bind(this),this.handleActivate=this.handleActivate.bind(this),this.handleFetch=this.handleFetch.bind(this),this.handleCache=this.handleCache.bind(this),s&&s.length>0&&self.importScripts(...s),r&&ef(),void 0!==i&&em({prefix:i}),a?self.skipWaiting():self.addEventListener("message",e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()}),n&&_(),e&&e.length>0&&this.addToPrecacheList(e),f.cleanupOutdatedCaches&&y(u.cacheName),this.registerRoute(new ey(this,d)),f.navigateFallback&&this.registerRoute(new j(this.createHandlerBoundToUrl(f.navigateFallback),{allowlist:f.navigateFallbackAllowlist,denylist:f.navigateFallbackDenylist})),void 0!==o&&("boolean"==typeof o?o&&eS({serwist:this}):eS({...o,serwist:this})),void 0!==c){if(void 0!==h){let e=new eN({fallbackUrls:h.entries,serwist:this});c.forEach(t=>{t.handler instanceof z&&!t.handler.plugins.some(e=>"handlerDidError"in e)&&t.handler.plugins.push(e)})}for(let e of c)this.registerCapture(e.matcher,e.handler,e.method)}l&&V()}get precacheStrategy(){return this._precacheStrategy}get routes(){return this._routes}addEventListeners(){self.addEventListener("install",this.handleInstall),self.addEventListener("activate",this.handleActivate),self.addEventListener("fetch",this.handleFetch),self.addEventListener("message",this.handleCache)}addToPrecacheList(e){let t=[];for(let a of e){"string"==typeof a?t.push(a):a&&!a.integrity&&void 0===a.revision&&t.push(a.url);let{cacheKey:e,url:s}=ew(a),i="string"!=typeof a&&a.revision?"reload":"default";if(this._urlsToCacheKeys.has(s)&&this._urlsToCacheKeys.get(s)!==e)throw new r("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(s),secondEntry:e});if("string"!=typeof a&&a.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==a.integrity)throw new r("add-to-cache-list-conflicting-integrities",{url:s});this._cacheKeysToIntegrities.set(e,a.integrity)}this._urlsToCacheKeys.set(s,e),this._urlsToCacheModes.set(s,i),t.length>0&&console.warn(`Serwist is precaching URLs without revision info: ${t.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`)}}handleInstall(e){return b(e,async()=>{let t=new ep;this.precacheStrategy.plugins.push(t),await H(this._concurrentPrecaching,Array.from(this._urlsToCacheKeys.entries()),async([t,a])=>{let s=this._cacheKeysToIntegrities.get(a),r=this._urlsToCacheModes.get(t),i=new Request(t,{integrity:s,cache:r,credentials:"same-origin"});await Promise.all(this.precacheStrategy.handleAll({event:e,request:i,url:new URL(i.url),params:{cacheKey:a}}))});let{updatedURLs:a,notUpdatedURLs:s}=t;return{updatedURLs:a,notUpdatedURLs:s}})}handleActivate(e){return b(e,async()=>{let e=await self.caches.open(this.precacheStrategy.cacheName),t=await e.keys(),a=new Set(this._urlsToCacheKeys.values()),s=[];for(let r of t)a.has(r.url)||(await e.delete(r),s.push(r.url));return{deletedCacheRequests:s}})}handleFetch(e){let{request:t}=e,a=this.handleRequest({request:t,event:e});a&&e.respondWith(a)}handleCache(e){if(e.data&&"CACHE_URLS"===e.data.type){let{payload:t}=e.data,a=Promise.all(t.urlsToCache.map(t=>{let a;return a="string"==typeof t?new Request(t):new Request(...t),this.handleRequest({request:a,event:e})}));e.waitUntil(a),e.ports?.[0]&&a.then(()=>e.ports[0].postMessage(!0))}}setDefaultHandler(e,t="GET"){this._defaultHandlerMap.set(t,F(e))}setCatchHandler(e){this._catchHandler=F(e)}registerCapture(e,t,a){let s=eg(e,t,a);return this.registerRoute(s),s}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new r("unregister-route-but-not-found-with-method",{method:e.method});let t=this._routes.get(e.method).indexOf(e);if(t>-1)this._routes.get(e.method).splice(t,1);else throw new r("unregister-route-route-not-registered")}getUrlsToPrecacheKeys(){return this._urlsToCacheKeys}getPrecachedUrls(){return[...this._urlsToCacheKeys.keys()]}getPrecacheKeyForUrl(e){let t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForPrecacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){let t=e instanceof Request?e.url:e,a=this.getPrecacheKeyForUrl(t);if(a)return(await self.caches.open(this.precacheStrategy.cacheName)).match(a)}createHandlerBoundToUrl(e){let t=this.getPrecacheKeyForUrl(e);if(!t)throw new r("non-precached-url",{url:e});return a=>(a.request=new Request(e),a.params={cacheKey:t,...a.params},this.precacheStrategy.handle(a))}handleRequest({request:e,event:t}){let a;let s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;let r=s.origin===location.origin,{params:i,route:n}=this.findMatchingRoute({event:t,request:e,sameOrigin:r,url:s}),c=n?.handler,o=e.method;if(!c&&this._defaultHandlerMap.has(o)&&(c=this._defaultHandlerMap.get(o)),!c)return;try{a=c.handle({url:s,request:e,event:t,params:i})}catch(e){a=Promise.reject(e)}let l=n?.catchHandler;return a instanceof Promise&&(this._catchHandler||l)&&(a=a.catch(async a=>{if(l)try{return await l.handle({url:s,request:e,event:t,params:i})}catch(e){e instanceof Error&&(a=e)}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw a})),a}findMatchingRoute({url:e,sameOrigin:t,request:a,event:s}){for(let r of this._routes.get(a.method)||[]){let i;let n=r.match({url:e,sameOrigin:t,request:a,event:s});if(n)return Array.isArray(i=n)&&0===i.length?i=void 0:n.constructor===Object&&0===Object.keys(n).length?i=void 0:"boolean"==typeof n&&(i=void 0),{route:r,params:i}}return{}}}"undefined"!=typeof navigator&&/^((?!chrome|android).)*safari/i.test(navigator.userAgent);let ek="cache-entries",eI=e=>{let t=new URL(e,location.href);return t.hash="",t.href};class eU{_cacheName;_db=null;constructor(e){this._cacheName=e}_getId(e){return`${this._cacheName}|${eI(e)}`}_upgradeDb(e){let t=e.createObjectStore(ek,{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1})}_upgradeDbAndDeleteOldDbs(e){this._upgradeDb(e),this._cacheName&&function(e,{blocked:t}={}){let a=indexedDB.deleteDatabase(e);t&&a.addEventListener("blocked",e=>t(e.oldVersion,e)),x(a).then(()=>void 0)}(this._cacheName)}async setTimestamp(e,t){e=eI(e);let a={id:this._getId(e),cacheName:this._cacheName,url:e,timestamp:t},s=(await this.getDb()).transaction(ek,"readwrite",{durability:"relaxed"});await s.store.put(a),await s.done}async getTimestamp(e){let t=await this.getDb(),a=await t.get(ek,this._getId(e));return a?.timestamp}async expireEntries(e,t){let a=await this.getDb(),s=await a.transaction(ek,"readwrite").store.index("timestamp").openCursor(null,"prev"),r=[],i=0;for(;s;){let a=s.value;a.cacheName===this._cacheName&&(e&&a.timestamp<e||t&&i>=t?(s.delete(),r.push(a.url)):i++),s=await s.continue()}return r}async getDb(){return this._db||(this._db=await N("serwist-expiration",1,{upgrade:this._upgradeDbAndDeleteOldDbs.bind(this)})),this._db}}class eL{_isRunning=!1;_rerunRequested=!1;_maxEntries;_maxAgeSeconds;_matchOptions;_cacheName;_timestampModel;constructor(e,t={}){this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._matchOptions=t.matchOptions,this._cacheName=e,this._timestampModel=new eU(e)}async expireEntries(){if(this._isRunning){this._rerunRequested=!0;return}this._isRunning=!0;let e=this._maxAgeSeconds?Date.now()-1e3*this._maxAgeSeconds:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),a=await self.caches.open(this._cacheName);for(let e of t)await a.delete(e,this._matchOptions);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,this.expireEntries())}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(!this._maxAgeSeconds)return!1;let t=await this._timestampModel.getTimestamp(e),a=Date.now()-1e3*this._maxAgeSeconds;return void 0===t||t<a}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(Number.POSITIVE_INFINITY)}}let eA=e=>{f.add(e)};class eO{_config;_cacheExpirations;constructor(e={}){this._config=e,this._cacheExpirations=new Map,this._config.maxAgeFrom||(this._config.maxAgeFrom="last-fetched"),this._config.purgeOnQuotaError&&eA(()=>this.deleteCacheAndMetadata())}_getCacheExpiration(e){if(e===l.getRuntimeName())throw new r("expire-custom-caches-only");let t=this._cacheExpirations.get(e);return t||(t=new eL(e,this._config),this._cacheExpirations.set(e,t)),t}cachedResponseWillBeUsed({event:e,cacheName:t,request:a,cachedResponse:s}){if(!s)return null;let r=this._isResponseDateFresh(s),i=this._getCacheExpiration(t),n="last-used"===this._config.maxAgeFrom,c=(async()=>{n&&await i.updateTimestamp(a.url),await i.expireEntries()})();try{e.waitUntil(c)}catch(e){}return r?s:null}_isResponseDateFresh(e){if("last-used"===this._config.maxAgeFrom)return!0;let t=Date.now();if(!this._config.maxAgeSeconds)return!0;let a=this._getDateHeaderTimestamp(e);return null===a||a>=t-1e3*this._config.maxAgeSeconds}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;let t=new Date(e.headers.get("date")).getTime();return Number.isNaN(t)?null:t}async cacheDidUpdate({cacheName:e,request:t}){let a=this._getCacheExpiration(e);await a.updateTimestamp(t.url),await a.expireEntries()}async deleteCacheAndMetadata(){for(let[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}let eM=(e,t,a)=>{let s,i;let n=e.size;if(a&&a>n||t&&t<0)throw new r("range-not-satisfiable",{size:n,end:a,start:t});return void 0!==t&&void 0!==a?(s=t,i=a+1):void 0!==t&&void 0===a?(s=t,i=n):void 0!==a&&void 0===t&&(s=n-a,i=n),{start:s,end:i}},eB=e=>{let t=e.trim().toLowerCase();if(!t.startsWith("bytes="))throw new r("unit-must-be-bytes",{normalizedRangeHeader:t});if(t.includes(","))throw new r("single-range-only",{normalizedRangeHeader:t});let a=/(\d*)-(\d*)/.exec(t);if(!a||!(a[1]||a[2]))throw new r("invalid-range-values",{normalizedRangeHeader:t});return{start:""===a[1]?void 0:Number(a[1]),end:""===a[2]?void 0:Number(a[2])}},eF=async(e,t)=>{try{if(206===t.status)return t;let a=e.headers.get("range");if(!a)throw new r("no-range-header");let s=eB(a),i=await t.blob(),n=eM(i,s.start,s.end),c=i.slice(n.start,n.end),o=c.size,l=new Response(c,{status:206,statusText:"Partial Content",headers:t.headers});return l.headers.set("Content-Length",String(o)),l.headers.set("Content-Range",`bytes ${n.start}-${n.end-1}/${i.size}`),l}catch(e){return new Response("",{status:416,statusText:"Range Not Satisfiable"})}};class eK{cachedResponseWillBeUsed=async({request:e,cachedResponse:t})=>t&&e.headers.has("range")?await eF(e,t):t}class ej extends z{async _handle(e,t){let a,s=await t.cacheMatch(e);if(!s)try{s=await t.fetchAndCachePut(e)}catch(e){e instanceof Error&&(a=e)}if(!s)throw new r("no-response",{url:e.url,error:a});return s}}class eW extends z{constructor(e={}){super(e),this.plugins.some(e=>"cacheWillUpdate"in e)||this.plugins.unshift(J)}async _handle(e,t){let a;let s=t.fetchAndCachePut(e).catch(()=>{});t.waitUntil(s);let i=await t.cacheMatch(e);if(i);else try{i=await s}catch(e){e instanceof Error&&(a=e)}if(!i)throw new r("no-response",{url:e.url,error:a});return i}}new eT({skipWaiting:!0,clientsClaim:!0,offlineAnalyticsConfig:!0,precacheEntries:[{'revision':'1743702451495','url':'/'},{'revision':null,'url':'/_next/static/chunks/100.2e3c450c44646831.js'},{'revision':null,'url':'/_next/static/chunks/57.268c8c590d7f2802.js'},{'revision':null,'url':'/_next/static/chunks/framework-84d6ee64cdf12741.js'},{'revision':null,'url':'/_next/static/chunks/main-8c981a1011f0ee00.js'},{'revision':null,'url':'/_next/static/chunks/pages/_app-dda99d97de7a1415.js'},{'revision':null,'url':'/_next/static/chunks/pages/_error-b41dbd85229d9331.js'},{'revision':null,'url':'/_next/static/chunks/pages/image-merger-e4f4f3ff3fc0894b.js'},{'revision':null,'url':'/_next/static/chunks/pages/index-4447b3b2993a04ed.js'},{'revision':'846118c33b2c0e922d7b3a7676f81f6f','url':'/_next/static/chunks/polyfills-42372ed130431b0a.js'},{'revision':null,'url':'/_next/static/chunks/webpack-6b8ea3372da2e26f.js'},{'revision':null,'url':'/_next/static/css/97d54a516a88d68f.css'},{'revision':'ea53bd37f69d2c6cd4d8f9ef66c924e5','url':'/_next/static/ruETBybfhq_-KLWMWkKed/_buildManifest.js'},{'revision':'b6652df95db52feb4daf4eca35380933','url':'/_next/static/ruETBybfhq_-KLWMWkKed/_ssgManifest.js'},{'revision':'1743702451495','url':'/image-merger'}],precacheOptions:{cleanupOutdatedCaches:!0,ignoreURLParametersMatching:[/.*/]},runtimeCaching:[{matcher:e=>{let{url:t}=e;return"/manifest.json"===t.pathname},handler:new ej({cacheName:"manifest",plugins:[new eO({maxAgeSeconds:60})]})},{matcher:e=>{let{request:t}=e;return"document"===t.destination},handler:new X},{matcher:/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,handler:new ej({cacheName:"static-font-assets"})},{matcher:/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,handler:new ej({cacheName:"static-image-assets"})},{matcher:/\/_next\/image\?url=.+$/i,handler:new ej({cacheName:"next-image"})},{matcher:/\.(?:mp3|wav|ogg)$/i,handler:new ej({cacheName:"static-audio-assets",plugins:[new eK]})},{matcher:/\.(?:mp4)$/i,handler:new ej({cacheName:"static-video-assets",plugins:[new eK]})},{matcher:/\.(?:js)$/i,handler:new eW({cacheName:"js-assets"})},{matcher:/\.(?:css|less)$/i,handler:new ej({cacheName:"static-style-assets"})},{matcher:/\/_next\/data\/.+\/.+\.json$/i,handler:new eW({cacheName:"next-data"})},{matcher:/\.(?:json|xml|csv)$/i,handler:new Y({cacheName:"static-data-assets"})}]}).addEventListeners()})();