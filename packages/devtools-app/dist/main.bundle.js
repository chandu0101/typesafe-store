!function(e){function t(t){for(var a,s,i=t[0],l=t[1],c=t[2],p=0,d=[];p<i.length;p++)s=i[p],Object.prototype.hasOwnProperty.call(o,s)&&o[s]&&d.push(o[s][0]),o[s]=0;for(a in l)Object.prototype.hasOwnProperty.call(l,a)&&(e[a]=l[a]);for(u&&u(t);d.length;)d.shift()();return r.push.apply(r,c||[]),n()}function n(){for(var e,t=0;t<r.length;t++){for(var n=r[t],a=!0,i=1;i<n.length;i++){var l=n[i];0!==o[l]&&(a=!1)}a&&(r.splice(t--,1),e=s(s.s=n[0]))}return e}var a={},o={0:0},r=[];function s(t){if(a[t])return a[t].exports;var n=a[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.m=e,s.c=a,s.d=function(e,t,n){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(s.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var a in e)s.d(n,a,function(t){return e[t]}.bind(null,a));return n},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="";var i=window.webpackJsonp=window.webpackJsonp||[],l=i.push.bind(i);i.push=t,i=i.slice();for(var c=0;c<i.length;c++)t(i[c]);var u=l;r.push([13,1]),n()}([,,,function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.routeSelector={fn:e=>e.app.route,dependencies:{app:["route"]}},t.appNameSelector={fn:e=>e.app.appName,dependencies:{app:["appName"]}},t.appNamesSelector={fn:e=>Object.keys(e.app.appsData),dependencies:{app:["appsData"]}},t.devToolsMessageSelector={fn:e=>e.app.wsMessage,dependencies:{app:["wsMessage"]}},t.actionsSelector={fn:e=>{const t=e.app.appName;return t.length?e.app.appsData[t].actions:[]},dependencies:{app:["appName","appsData"]}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const a=n(1);t.useAppDispatch=function(){return a.useDispatch()}},,,,,,,,function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});class a{static createMessageRequest(e){return{url:this.url,message:e}}}a.url="ws://localhost:8998",t.default=a},function(e,t,n){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}},o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)Object.hasOwnProperty.call(e,n)&&(t[n]=e[n]);return t.default=e,t};Object.defineProperty(t,"__esModule",{value:!0});const r=a(n(0)),s=a(n(6));n(18);const i=a(n(20)),l=o(n(36)),c=n(38),u=n(1),p=a(n(47));console.log("Hello "),s.default.render(r.default.createElement(r.default.StrictMode,null,r.default.createElement(u.Provider,{store:c.store},r.default.createElement(i.default,null),r.default.createElement(p.default,null))),document.getElementById("root")),l.unregister()},,,,,function(e,t,n){var a=n(7),o=n(19);"string"==typeof(o=o.__esModule?o.default:o)&&(o=[[e.i,o,""]]);var r={insert:"head",singleton:!1},s=(a(o,r),o.locals?o.locals:{});e.exports=s},function(e,t,n){(t=n(8)(!1)).push([e.i,"body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\ncode {\n  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',\n    monospace;\n}\n\n\n.nav-bar {\n  display: flex;\n  flex-direction: column;\n  width: 100px;;\n}\n\n.nav-bar__item-selected {\n  font-weight: bold;\n  color: red;\n}\n.app-layout {\n   display: flex;\n   flex-direction: column;\n   height: 100vh;\n   width: 100%;\n}\n\n.app-header {\n   height: 64px;\n   background-color: green;\n   color: white;\n}\n\n.app-main {\n  display: flex;\n  \n}\n\n.app-bar {\n   display: flex;\n   justify-content: space-around;\n}",""]),e.exports=t},function(e,t,n){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0});const o=a(n(0));n(21);const r=n(1),s=n(3),i=n(32),l=a(n(33));t.default=function(){const e=r.useSelector(s.routeSelector);let t=null;return"actions"===e?t=o.default.createElement(i.ActionsList,null):"about"===e&&(t=o.default.createElement("div",null," State COmp")),o.default.createElement(l.default,null,t)}},function(e,t,n){var a=n(7),o=n(22);"string"==typeof(o=o.__esModule?o.default:o)&&(o=[[e.i,o,""]]);var r={insert:"head",singleton:!1},s=(a(o,r),o.locals?o.locals:{});e.exports=s},function(e,t,n){(t=n(8)(!1)).push([e.i,".App {\n  text-align: center;\n}\n\n.App-logo {\n  height: 40vmin;\n  pointer-events: none;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  .App-logo {\n    animation: App-logo-spin infinite 20s linear;\n  }\n}\n\n.App-header {\n  background-color: #282c34;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  font-size: calc(10px + 2vmin);\n  color: white;\n}\n\n.App-link {\n  color: #61dafb;\n}\n\n@keyframes App-logo-spin {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n}\n",""]),e.exports=t},,,,,,,,,,function(e,t,n){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0});const o=a(n(0)),r=n(1),s=n(3);t.ActionsList=({})=>{console.log("rendering action list");const e=r.useSelector(s.actionsSelector);return o.default.createElement("div",null,"Actions :",o.default.createElement("ul",null,e.map((e,t)=>o.default.createElement("li",{key:`${e.name}-${e.group}-i`},"Name : ",e.name,"Group : ",e.group))))}},function(e,t,n){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0});const o=a(n(0)),r=n(34),s=a(n(35));t.default=({children:e})=>o.default.createElement("div",{className:"app-layout"},o.default.createElement(s.default,null),o.default.createElement("div",{className:"app-main"},o.default.createElement(r.NavBar,null),e))},function(e,t,n){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0});const o=a(n(0)),r=n(1),s=n(3),i=n(4);t.NavBar=({})=>{const e=r.useSelector(s.routeSelector),t=i.useAppDispatch(),n=e=>{console.log("hcl",e),t({name:"setRoute",group:"AppReducer",payload:e})};return o.default.createElement("div",{className:"nav-bar"},o.default.createElement("div",{className:""+("actions"===e?"nav-bar__item-selected":""),onClick:()=>n("actions")},"Actions"),o.default.createElement("div",{className:""+("about"===e?"nav-bar__item-selected":""),onClick:()=>n("about")},"Others"))}},function(e,t,n){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0});const o=a(n(0)),r=n(1),s=n(3),i=n(4);t.default=({})=>{const e=r.useSelector(s.appNameSelector),t=r.useSelector(s.appNamesSelector),n=i.useAppDispatch();return o.default.createElement("div",{className:"app-bar"},o.default.createElement("div",null,"TypeSafe Store Dev Toolss"),o.default.createElement("div",null,t.length>0&&o.default.createElement("select",{value:e.length,onChange:e=>{const t=e.target.value;n({name:"setAppName",group:"AppReducer",payload:t})}},t.map(e=>o.default.createElement("option",{key:e,value:e},"a")))))}},function(e,t,n){"use strict";(function(e){Object.defineProperty(t,"__esModule",{value:!0});const n=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function a(e,t){navigator.serviceWorker.register(e).then(e=>{e.onupdatefound=()=>{const n=e.installing;null!=n&&(n.onstatechange=()=>{"installed"===n.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://bit.ly/CRA-PWA."),t&&t.onUpdate&&t.onUpdate(e)):(console.log("Content is cached for offline use."),t&&t.onSuccess&&t.onSuccess(e)))})}}).catch(e=>{console.error("Error during service worker registration:",e)})}t.register=function(t){if("serviceWorker"in navigator){if(new URL(e.env.PUBLIC_URL,window.location.href).origin!==window.location.origin)return;window.addEventListener("load",()=>{const o=e.env.PUBLIC_URL+"/service-worker.js";n?(!function(e,t){fetch(e,{headers:{"Service-Worker":"script"}}).then(n=>{const o=n.headers.get("content-type");404===n.status||null!=o&&-1===o.indexOf("javascript")?navigator.serviceWorker.ready.then(e=>{e.unregister().then(()=>{window.location.reload()})}):a(e,t)}).catch(()=>{console.log("No internet connection found. App is running in offline mode.")})}(o,t),navigator.serviceWorker.ready.then(()=>{console.log("This web app is being served cache-first by a service worker. To learn more, visit https://bit.ly/CRA-PWA")})):a(o,t)})}},t.unregister=function(){"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(e=>{e.unregister()}).catch(e=>{console.error(e.message)})}}).call(this,n(37))},,function(e,t,n){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0});const o=n(39),r=n(40),s=n(11),i=a(n(12)),l=a(n(46)),c={app:o.AppReducerGroup},u=s.createWebSocketMiddleware({urlOptions:{[i.default.url]:l.default}});t.store=new r.TypeSafeStore({reducers:c,middleWares:[u]})},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.AppReducerGroup={r:(e,t)=>{switch(t.name){case"setAppName":{const n=t.payload;return Object.assign(Object.assign({},e),{appName:n})}case"setRoute":{const n=t.payload;return Object.assign(Object.assign({},e),{route:n})}case"initializeApp":{const n=t.payload;let a=e.appName,o=Object.assign({},e.appsData);return console.log("initializing app :",n),a=n,o[n]={actions:[]},Object.assign(Object.assign({},e),{appName:a,appsData:o})}case"addAction":{const{appName:n,action:a}=t.payload;return Object.assign(Object.assign({},e),{appsData:Object.assign(Object.assign({},e.appsData),{[n]:Object.assign(Object.assign({},e.appsData[n]),{actions:e.appsData[n].actions.concat(a)})})})}}},g:"AppReducer",ds:{route:"actions",appName:"",appsData:{},wsMessage:{}},m:{async:void 0,a:{wsMessage:{ws:{}}}}}},,,,,,,function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const a={createMessage:(e,t)=>JSON.stringify(Object.assign(Object.assign({},e),{id:t})),parseMessage:e=>{const t=JSON.parse(e);return[t,t.id]},onOpenMessage:()=>JSON.stringify({kind:"InitiateConnection",type:"DevTools"})};t.default=a},function(e,t,n){"use strict";var a=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)Object.hasOwnProperty.call(e,n)&&(t[n]=e[n]);return t.default=e,t},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0});const r=a(n(0)),s=n(11),i=o(n(12)),l=n(1),c=n(3),u=n(4);t.default=({})=>{const e=l.useSelector(c.devToolsMessageSelector),t=u.useAppDispatch();if(console.log("Rendering :","MessageListener"),e.error)console.log("Error from ws :",e.error);else if(e.data){const n=e.data;console.log("got message :",n),"AppConnection"===n.kind?(console.log("dispatching AppConnection action",n.appName),t({group:"AppReducer",name:"initializeApp",payload:n.appName})):"Action"==n.kind&&t({group:"AppReducer",name:"addAction",payload:{action:Object.assign(Object.assign({},n.action),{state:n.stateChanged}),appName:n.appName}})}return r.useEffect(()=>(t({group:"AppReducer",name:"wsMessage",ws:i.default.createMessageRequest({kind:"StartMessage",id:""})}),()=>{s.createGlobalSocketCloseAction(i.default.url)}),[]),r.default.createElement("div",null," ")}}]);
//# sourceMappingURL=main.bundle.js.map