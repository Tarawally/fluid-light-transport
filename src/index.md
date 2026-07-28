---
title: Visualisation
toc: false
---

<link rel="stylesheet" href="./style.css">

```js
const sceneData = await FileAttachment("./assets/scene.json").json();
if (typeof window !== "undefined") {
  window.CONFIG = window.CONFIG || {};
  window.CONFIG.SCENE_DATA = sceneData;
}
await import("./engine.js");
```

<div class="simulation-root" style="position: relative; width: 100%; height: calc(100vh - 120px); border-radius: 8px; overflow: hidden; background: #000;">
  <div class="simulation-wrapper" style="position: relative; width: 100%; height: 100%;">
    <div id="ui">
      <div class="header">
        <span>VISUALISATION STATUS</span>
        <span id="statusIndicator">● INITIALISING</span>
      </div>
      <div class="stat-row">
        <span class="label">Renderer:</span>
        <span class="value">Hybrid Ray-Trace/CA</span>
      </div>
      <div class="stat-row">
        <span class="label">Internal Grid:</span>
        <span class="value" id="resDisplay">Loading...</span>
      </div>
      <div class="stat-row">
        <span class="label">View Mode:</span>
        <span class="value" id="viewModeDisplay">Composite Output</span>
      </div>
      <div class="section-divider">Performance Telemetry</div>
      <div class="stat-row">
        <span class="label">Frame Rate:</span>
        <span class="value" id="fps">0 FPS</span>
      </div>
      <div class="stat-row">
        <span class="label">Compute Time:</span>
        <span class="value" id="physTime">0.0ms</span>
      </div>
      <div class="perf-track">
        <div id="loadBar" class="perf-bar"></div>
      </div>
      <div class="stat-row" style="margin-top: 10px">
        <span class="label">Data Source:</span>
        <span class="value" id="sceneSource">Loading...</span>
      </div>
      <div class="section-divider">Optimisation Metrics</div>
      <div class="stat-row">
        <span class="label">Active Regions:</span>
        <span class="value" id="activeBlocks">0</span>
      </div>
      <div class="stat-row">
        <span class="label">Grid Sparsity:</span>
        <span class="value" id="budget">0%</span>
      </div>
      <div class="controls-hint">
        <strong>CONTROLS:</strong><br />
        <span class="key">WASD</span> Movement &nbsp;
        <span class="key">ARROWS</span> Look<br />
        <span class="key">L-CLICK</span> Rotate &nbsp;
        <span class="key">R-CLICK</span> Move Light<br />
        <span class="key">SPACE</span> Cycle Visualisation Modes
      </div>
      <div class="section-divider">Physics Parameters</div>
      <div class="stat-row control-row">
        <span class="label">Dissipation:</span>
        <input type="range" id="dissipationSlider" min="0.80" max="0.99" step="0.01" value="0.97" />
      </div>
      <div class="stat-row control-row">
        <span class="label">Advection:</span>
        <input type="range" id="advectionSlider" min="0.0" max="5.0" step="0.1" value="3.0" />
      </div>
      <div class="stat-row control-row">
        <span class="label">Decay:</span>
        <input type="range" id="decaySlider" min="0.5" max="0.99" step="0.01" value="0.92" />
      </div>
    </div>
    <canvas id="canvas" tabindex="0" role="img" aria-label="Fluid Light Transport Visualisation"></canvas>
  </div>
</div>



