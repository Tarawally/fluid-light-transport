---
title: Full Visualisation
toc: false
---

```js
// Standard Observable FileAttachment relative to src/
const standaloneUrl = await FileAttachment("./engine/index.html").url();

display(html`<iframe 
  src="${standaloneUrl}" 
  style="width: 100%; height: calc(100vh - 120px); border: none; border-radius: 8px; background: #000;"
  title="Fluid Light Transport Visualisation">
</iframe>`);
```
