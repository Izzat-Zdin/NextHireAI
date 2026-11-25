import{c as n,h as a,q as o}from"./app-C3GL9_Zo.js";/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r={name:"user-check",size:24,node:[["path",{d:"m16 11 2 2 4-4",key:"9rsbq5"}],["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]]};r.node;const p=n(r);/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c={name:"user-x",size:24,node:[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"17",x2:"22",y1:"8",y2:"13",key:"3nzzx3"}],["line",{x1:"22",x2:"17",y1:"8",y2:"13",key:"1swrse"}]]};c.node;const d=n(c);function y(e){return e.replace(/\s+/g," ").trim()}async function m({search:e="",role:s="all",status:t="all",page:i=1,pageSize:u=20}={}){return a.get(`/api/admin/users${o({search:y(e),role:s==="all"?"":s,status:t==="all"?"":t,page:i,pageSize:u})}`)}async function k(){return a.get("/api/admin/users/stats")}async function f(e){return a.getOrNull(`/api/admin/users/${e}`)}async function h(e){return a.get(`/api/admin/users/${e}/activity`)}function g(e,s){return a.patch(`/api/admin/users/${e}/status`,{status:s})}function x(e,s){return a.patch(`/api/admin/users/${e}/role`,{role:s})}export{d as U,h as a,p as b,x as c,k as d,f as g,m as l,g as s};
