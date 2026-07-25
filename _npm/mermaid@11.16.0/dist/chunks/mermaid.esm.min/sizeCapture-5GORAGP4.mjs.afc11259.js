/**
 * Bundled by jsDelivr using Rollup v4.62.2 and esbuild v0.28.1.
 * Original file: /npm/mermaid@11.16.0/dist/chunks/mermaid.esm.min/sizeCapture-5GORAGP4.mjs
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var c=Object.defineProperty,i=(r,a)=>c(r,"name",{value:a,configurable:!0});function o(){if(!(typeof globalThis>"u"))return globalThis}i(o,"getCaptureGlobal");function u(){return!!o()?.mermaidCaptureSizes}i(u,"shouldCaptureSizes");function d(){return typeof location>"u"?"browser-dev":`${location.pathname}${location.search}`}i(d,"capturedFromLocation");function s(r,a){let t=o();if(!t)return;let e=a.node(),p=((e&&"ownerSVGElement"in e?e.ownerSVGElement:null)??e)?.id??"(unknown)";t.mermaidCapturedSizes??=[];let n={svgId:p,sizes:r};t.mermaidCapturedSizes.push(n),t.mermaidLastCapturedSizes=n}i(s,"emitCapturedSizes");function l(r,a){let t=[];for(let e of a.nodes)e.isGroup||t.push({id:e.id,width:e.width??0,height:e.height??0});t.length!==0&&s({metadata:{captureVersion:1,capturedAt:new Date().toISOString(),capturedFrom:d()},nodes:t},r)}i(l,"captureNodeSizes");export{l as captureNodeSizes,u as shouldCaptureSizes};
