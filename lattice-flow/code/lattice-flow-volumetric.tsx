import React, { useEffect, useRef, useState } from 'react';
import { 
  Activity, Scale, ChevronLeft, ChevronRight, Waypoints, 
  Zap, ShieldAlert, Cpu, Share2, BarChart3, Binary, RefreshCw, 
  Move, Maximize, Target, Gauge, LineChart, Database, Eye, Settings2,
  Terminal, Layers, Wind, Radio, ZapOff, Sparkles, Moon, Unplug
} from 'lucide-react';

/**
 * LATTICE FLOW: PHASE 4.4.3 (Hybrid Holographic Engine)
 * UNIFIED COMPUTATIONAL FRAMEWORK
 * * * Visibility Patch:
 * - Render Mode: Instanced Unitary Sprites (High Visibility).
 * - Dynamics: Hamiltonian SU(2) Unitary Precession.
 * - Adjacency: Prime-Generator Cayley Graph.
 */

const commonStructs = `
    struct Node {
        @align(16) @size(12) pos: vec3<f32>,
        @align(4)  @size(4)  energy: f32,       
        @align(16) @size(12) vel: vec3<f32>,
        @align(4)  @size(4)  frustration: f32, 
        @align(8)  @size(8)  stalk: vec2<f32>,   
        @align(4)  @size(4)  id: u32,
        @align(4)  @size(4)  _pad: f32,         
    };

    struct Params {
        dt: f32,
        coupling: f32,
        damping: f32,
        zoom: f32,
        aspect: f32,
        time: f32,
        node_count: f32,
        edge_count: f32,
        rot_x: f32,
        rot_y: f32,
        knot_threshold: f32,
        lensing_strength: f32,
    };

    struct Telemetry {
        energy_sum: f32,
        frustration_sum: f32,
        knot_count: f32,
        _pad: f32,
    };

    fn pcg_hash(input: u32) -> u32 {
        var state = input * 747796405u + 2891336453u;
        var word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
        return (word >> 22u) ^ word;
    }

    fn Rz_gate(theta: f32, s: vec2<f32>) -> vec2<f32> {
        let h = theta * 0.5;
        let c = cos(h); let sn = sin(h);
        return vec2<f32>(s.x * c - s.y * sn, s.x * sn + s.y * c);
    }

    fn Rx_gate(theta: f32, s: vec2<f32>) -> vec2<f32> {
        let h = theta * 0.5;
        let c = cos(h); let sn = sin(h);
        return vec2<f32>(s.x * c, -s.x * sn + s.y * c);
    }
`;

const computeShaderSource = `
    ${commonStructs}
    @group(0) @binding(0) var<uniform> p: Params;
    @group(0) @binding(1) var<storage, read> nodes_in: array<Node>;
    @group(0) @binding(2) var<storage, read_write> nodes_out: array<Node>;
    @group(0) @binding(3) var<storage, read_write> edges: array<u32>;
    @group(0) @binding(4) var<storage, read> edge_pointers: array<u32>;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
        let id = gid.x;
        if (id >= u32(p.node_count)) { return; }
        
        var n = nodes_in[id];
        var force = vec3<f32>(0.0);
        var laplace = vec2<f32>(0.0);
        var energy_advection = 0.0;
        var f_accum = 0.0;

        let start = edge_pointers[id];
        let end = edge_pointers[id + 1];

        for (var i = start; i < end; i++) {
            var n_id = edges[i];
            if (n_id == 0xffffffffu) { continue; }
            
            let neighbor = nodes_in[n_id];
            let d_vec = neighbor.pos - n.pos;
            let dist = max(0.1, length(d_vec));
            
            // Phase correlation modulates tension
            let correlation = dot(n.stalk, neighbor.stalk);
            let tension = (dist - 1.45) * (0.05 + correlation * 0.04);
            force += (d_vec / dist) * tension;
            
            // Phase difference (Z-gauge)
            let diff_stalk = neighbor.stalk - n.stalk;
            laplace += diff_stalk;
            
            energy_advection += (neighbor.energy - n.energy) * 0.1 * p.coupling;
            f_accum += length(diff_stalk);

            // Algebraic Dissolution
            if (length(diff_stalk) > p.knot_threshold + 1.0 && p.time > 15.0) {
                edges[i] = 0xffffffffu;
            }
        }

        let ts = clamp(p.dt, 0.0, 0.016);
        n.vel = (n.vel + force * ts) * (1.0 - p.damping);
        n.pos += n.vel * ts;
        n.pos *= 0.9985; // Bounding force

        // Unitary Unit Precession
        let z_angle = length(laplace) * p.coupling * ts;
        let x_angle = n.energy * 0.2 * ts;
        
        var s = Rz_gate(z_angle, n.stalk);
        s = Rx_gate(x_angle, s);
        n.stalk = normalize(s);

        n.energy = clamp(n.energy + energy_advection * ts, 0.05, 20.0) * (1.0 - p.damping * 0.05);
        n.frustration = f_accum;

        if (abs(n.pos.x) > 100.0) { n.pos = vec3<f32>(0.0); }
        nodes_out[id] = n;
    }
`;

const telemetryShaderSource = `
    ${commonStructs}
    @group(0) @binding(0) var<uniform> p: Params;
    @group(0) @binding(1) var<storage, read> nodes: array<Node>;
    @group(0) @binding(2) var<storage, read_write> tel: array<Telemetry>;

    var<workgroup> s_e: array<f32, 64>;
    var<workgroup> s_f: array<f32, 64>;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>, @builtin(workgroup_id) wid: vec3<u32>) {
        let i = gid.x;
        var e = 0.0; var f = 0.0;
        if (i < u32(p.node_count)) {
            let n = nodes[i];
            e = n.energy;
            f = n.frustration;
        }
        s_e[lid.x] = e; s_f[lid.x] = f;
        workgroupBarrier();

        for (var s = 32u; s > 0u; s >>= 1u) {
            if (lid.x < s) {
                s_e[lid.x] += s_e[lid.x + s];
                s_f[lid.x] += s_f[lid.x + s];
            }
            workgroupBarrier();
        }

        if (lid.x == 0u) {
            tel[wid.x].energy_sum = s_e[0];
            tel[wid.x].frustration_sum = s_f[0];
        }
    }
`;

const renderShaderSource = `
    ${commonStructs}
    @group(0) @binding(0) var<storage, read> nodes: array<Node>;
    @group(0) @binding(1) var<uniform> p: Params;

    struct VOut {
        @builtin(position) pos: vec4<f32>,
        @location(0) uv: vec2<f32>,
        @location(1) @interpolate(flat) id: u32,
    };

    @vertex
    fn v_main(@builtin(vertex_index) v_idx: u32, @builtin(instance_index) i_idx: u32) -> VOut {
        let n = nodes[i_idx];
        let quad = array<vec2<f32>, 4>(vec2(-1.,-1.), vec2(1.,-1.), vec2(-1.,1.), vec2(1.,1.));
        let uv = quad[v_idx];
        
        var pos = n.pos;
        let cx = cos(p.rot_x); let sx = sin(p.rot_x);
        let cy = cos(p.rot_y); let sy = sin(p.rot_y);
        
        let py = pos.y * cy - pos.z * sy;
        let pz_t = pos.y * sy + pos.z * cy;
        pos.y = py; pos.z = pz_t;
        
        let px = pos.x * cx - pos.z * sx;
        let pz = pos.x * sx + pos.z * cx;
        pos.x = px; pos.z = pz;

        let depth = pz + 20.0;
        let scale = (0.1 + n.energy * 0.1) * p.zoom / max(1.0, depth);
        
        var out: VOut;
        out.pos = vec4<f32>(
            (pos.x * p.zoom / depth / p.aspect) + (uv.x * scale / p.aspect),
            (pos.y * p.zoom / depth) + (uv.y * scale),
            0.0, 1.0
        );
        out.uv = uv;
        out.id = i_idx;
        return out;
    }

    fn hsv2rgb(c: vec3<f32>) -> vec3<f32> {
        let K = vec4<f32>(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        let px = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(px - K.xxx, vec3(0.0), vec3(1.0)), c.y);
    }

    @fragment
    fn f_main(in: VOut) -> @location(0) vec4<f32> {
        let d = length(in.uv);
        if (d > 1.0) { discard; }
        
        let n = nodes[in.id];
        let hue = (atan2(n.stalk.y, n.stalk.x) / 6.2831) + 0.5;
        let glow = pow(1.0 - d, 3.0) * (0.5 + n.energy * 0.5);
        
        // QReLU interference pattern inside the sprite
        let pattern = sin(d * 10.0 - p.time * 5.0 + hue * 6.28);
        let alpha = glow * (0.8 + 0.2 * pattern);
        
        let rgb = hsv2rgb(vec3(hue, 0.7, 1.0)) * (0.5 + n.energy * 0.2);
        return vec4<f32>(rgb, alpha);
    }
`;

const InstrumentSlider = ({ label, value, min, max, step, onChange, icon: Icon }) => (
  <div className="space-y-2 group text-slate-500 hover:text-indigo-400 transition-colors">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
        {Icon && <Icon size={12} className="opacity-40" />} {label}
      </label>
      <span className="text-[10px] font-mono text-indigo-300/80 bg-indigo-500/5 px-2 py-0.5 rounded border border-white/5">{value.toFixed(4)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-slate-900 rounded-full appearance-none cursor-crosshair accent-indigo-500 shadow-inner" />
  </div>
);

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef({ device: null, context: null, format: null, initialised: false, frameCount: 0, isMapping: false });
  const buffersRef = useRef({ nodesA: null, nodesB: null, params: null, edges: null, pointers: null, telemetry: null, staging: null });
  const [params, setParams] = useState({ coupling: 18.0, damping: 0.05, zoom: 25.0, aspect: 1.0, node_count: 512, dt: 0.016, knot_threshold: 0.8, lensing: 1.0 });
  const [telemetry, setTelemetry] = useState({ avgEnergy: 0, frustration: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [gpuStatus, setGpuStatus] = useState("Initializing...");

  const rotRef = useRef({ x: 0.8, y: 0.4 });
  const paramsRef = useRef(params);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => { paramsRef.current = params; }, [params]);

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    rotRef.current.x += (e.clientX - lastPos.current.x) * 0.005;
    rotRef.current.y += (e.clientY - lastPos.current.y) * 0.005;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const reseed = (energyBoost = 10.0) => {
    if (!engineRef.current.initialised) return;
    const data = new Float32Array(params.node_count * 12);
    for (let i = 0; i < params.node_count; i++) {
      const o = i * 12;
      data[o] = (Math.random() - 0.5) * 10; data[o+1] = (Math.random() - 0.5) * 10; data[o+2] = (Math.random() - 0.5) * 10;
      data[o+3] = energyBoost + Math.random() * 5.0; 
      const phase = i * 0.1; data[o+8] = Math.cos(phase); data[o+9] = Math.sin(phase);
      new Uint32Array(data.buffer)[(o+10)*4/4] = i;
    }
    engineRef.current.device.queue.writeBuffer(buffersRef.current.nodesA, 0, data);
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        if (!navigator.gpu) { setGpuStatus("WebGPU not supported"); return; }
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const context = canvasRef.current.getContext('webgpu');
        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format, alphaMode: 'premultiplied' });

        const nodeCount = params.node_count;
        const nodesA = device.createBuffer({ size: nodeCount * 48, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
        const nodesB = device.createBuffer({ size: nodeCount * 48, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
        const paramsBuffer = device.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        const telGroups = Math.ceil(nodeCount / 64);
        const telBuffer = device.createBuffer({ size: telGroups * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
        const staging = device.createBuffer({ size: telGroups * 16, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });

        // Adjacency: SL(2, Z) Algebraic Generators
        const edges = []; const ptrs = new Uint32Array(nodeCount + 1);
        const gA = 17; const gB = 37;
        let cE = 0;
        for (let i = 0; i < nodeCount; i++) {
          ptrs[i] = cE;
          const ns = [(i+1)%nodeCount, (i-1+nodeCount)%nodeCount, (i*gA)%nodeCount, (i*gB)%nodeCount];
          const unq = [...new Set(ns)].filter(n => n < nodeCount);
          for (const n of unq) { edges.push(n); cE++; }
        }
        ptrs[nodeCount] = cE;
        const eBuf = device.createBuffer({ size: edges.length * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
        device.queue.writeBuffer(eBuf, 0, new Uint32Array(edges));
        const pBuf = device.createBuffer({ size: ptrs.length * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
        device.queue.writeBuffer(pBuf, 0, ptrs);

        const modC = device.createShaderModule({ code: computeShaderSource });
        const modT = device.createShaderModule({ code: telemetryShaderSource });
        const modR = device.createShaderModule({ code: renderShaderSource });

        const pC = device.createComputePipeline({ layout: 'auto', compute: { module: modC, entryPoint: 'main' } });
        const pT = device.createComputePipeline({ layout: 'auto', compute: { module: modT, entryPoint: 'main' } });
        const pR = device.createRenderPipeline({
          layout: 'auto', vertex: { module: modR, entryPoint: 'v_main' },
          fragment: { module: modR, entryPoint: 'f_main', targets: [{ format, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' } } }] },
          primitive: { topology: 'triangle-strip' }
        });

        const bgs = {
          cA: device.createBindGroup({ layout: pC.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:paramsBuffer}}, {binding:1, resource:{buffer:nodesA}}, {binding:2, resource:{buffer:nodesB}}, {binding:3, resource:{buffer:eBuf}}, {binding:4, resource:{buffer:pBuf}}] }),
          cB: device.createBindGroup({ layout: pC.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:paramsBuffer}}, {binding:1, resource:{buffer:nodesB}}, {binding:2, resource:{buffer:nodesA}}, {binding:3, resource:{buffer:eBuf}}, {binding:4, resource:{buffer:pBuf}}] }),
          tA: device.createBindGroup({ layout: pT.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:paramsBuffer}}, {binding:1, resource:{buffer:nodesB}}, {binding:2, resource:{buffer:telBuffer}}] }),
          tB: device.createBindGroup({ layout: pT.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:paramsBuffer}}, {binding:1, resource:{buffer:nodesA}}, {binding:2, resource:{buffer:telBuffer}}] }),
          rA: device.createBindGroup({ layout: pR.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:nodesB}}, {binding:1, resource:{buffer:paramsBuffer}}] }),
          rB: device.createBindGroup({ layout: pR.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:nodesA}}, {binding:1, resource:{buffer:paramsBuffer}}] })
        };

        engineRef.current = { device, context, format, initialised: true, frameCount: 0, isMapping: false };
        buffersRef.current = { nodesA, nodesB, params: paramsBuffer, edges: eBuf, pointers: pBuf, telemetry: telBuffer, staging: staging };
        setGpuStatus("GPU Cycle: Active");
        
        const frame = (t) => {
          if (!isMounted) return;
          const e = engineRef.current;
          const isOdd = e.frameCount % 2 === 1;
          const cP = paramsRef.current;
          
          // Auto-Orbit Logic
          rotRef.current.x += 0.001; 
          const cR = rotRef.current;

          device.queue.writeBuffer(buffersRef.current.params, 0, new Float32Array([cP.dt, cP.coupling, cP.damping, cP.zoom, cP.aspect, t/1000, cP.node_count, edges.length, cR.x, cR.y, cP.knot_threshold, cP.lensing]));

          const enc = device.createCommandEncoder();
          const cp = enc.beginComputePass();
          cp.setPipeline(pC); cp.setBindGroup(0, isOdd ? bgs.cB : bgs.cA);
          cp.dispatchWorkgroups(Math.ceil(nodeCount / 64)); cp.end();

          const tp = enc.beginComputePass();
          tp.setPipeline(pT); tp.setBindGroup(0, isOdd ? bgs.tB : bgs.tA);
          tp.dispatchWorkgroups(telGroups); tp.end();

          const rp = enc.beginRenderPass({ colorAttachments: [{ view: e.context.getCurrentTexture().createView(), clearValue: {r:0.0, g:0.0, b:0.01, a:1}, loadOp: 'clear', storeOp: 'store' }] });
          rp.setPipeline(pR); rp.setBindGroup(0, isOdd ? bgs.rA : bgs.rB);
          rp.draw(4, nodeCount); rp.end();

          if (!e.isMapping && e.frameCount % 12 === 0) { enc.copyBufferToBuffer(telBuffer, 0, staging, 0, telGroups * 16); }
          device.queue.submit([enc.finish()]);

          if (!e.isMapping && e.frameCount % 12 === 0) {
            e.isMapping = true;
            staging.mapAsync(GPUMapMode.READ).then(() => {
              if (isMounted) {
                const d = new Float32Array(staging.getMappedRange());
                let se = 0; let sf = 0;
                for (let j=0; j<telGroups; j++) { se += d[j*4]; sf += d[j*4+1]; }
                setTelemetry({ avgEnergy: se/nodeCount, frustration: sf/nodeCount });
                if (se / nodeCount < 0.1) { reseed(6.0); }
              }
              staging.unmap(); e.isMapping = false;
            });
          }
          e.frameCount++;
          requestAnimationFrame(frame);
        };

        const obs = new ResizeObserver(entries => {
          const entry = entries[0];
          if (!entry || !canvasRef.current || !engineRef.current.initialised) return;
          const { width, height } = entry.contentRect;
          const dpr = window.devicePixelRatio || 1;
          canvasRef.current.width = Math.floor(width * dpr);
          canvasRef.current.height = Math.floor(height * dpr);
          setParams(p => ({ ...p, aspect: Math.max(0.1, canvasRef.current.width / canvasRef.current.height) }));
          engineRef.current.context.configure({ device: engineRef.current.device, format: engineRef.current.format, alphaMode: 'premultiplied' });
        });
        obs.observe(canvasRef.current.parentElement);

        reseed();
        requestAnimationFrame(frame);
      } catch (err) { setGpuStatus("Hardware Error: " + err.message); }
    };
    init(); return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex h-screen bg-black text-slate-300 font-sans overflow-hidden select-none">
      <aside className={`w-80 border-r border-white/5 bg-[#050508] flex flex-col z-40 transition-transform duration-700 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <header className="p-10 border-b border-white/5 flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40"><Binary size={24} className="text-white" /></div>
          <div>
            <h1 className="text-[13px] font-black tracking-[0.3em] uppercase text-white">Lattice flow</h1>
            <p className="text-[9px] font-mono uppercase tracking-widest opacity-20 mt-1">Phase 4.4.3 Engine</p>
          </div>
        </header>

        <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scroll">
          <section className="space-y-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 flex items-center gap-3"><Settings2 size={14} /> Substrate Logic</h3>
            <InstrumentSlider label="Phase Coupling" value={params.coupling} min={0} max={40} step={0.1} icon={Zap} onChange={v => setParams(p => ({...p, coupling: v}))} />
            <InstrumentSlider label="Graph Scale" value={params.zoom} min={1} max={100} step={0.1} icon={Scale} onChange={v => setParams(p => ({...p, zoom: v}))} />
            <InstrumentSlider label="Metric Damping" value={params.damping} min={0} max={0.2} step={0.001} icon={Activity} onChange={v => setParams(p => ({...p, damping: v}))} />
            <InstrumentSlider label="Dissolution Threshold" value={params.knot_threshold} min={0.1} max={3.0} step={0.01} icon={Target} onChange={v => setParams(p => ({...p, knot_threshold: v}))} />
            
            <button onClick={() => reseed()} className="w-full py-4 flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:bg-indigo-600 hover:text-white transition-all group shadow-sm">
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-1000" /> Reseed Manifold
            </button>
          </section>

          <section className="pt-10 border-t border-white/5 space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 flex items-center gap-3"><BarChart3 size={14} /> Telemetry</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-1">
                <p className="text-[7px] font-bold opacity-30 uppercase tracking-[0.2em]">Frustration</p>
                <p className="text-lg font-mono text-indigo-400">{telemetry.frustration.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-1">
                <p className="text-[7px] font-bold opacity-30 uppercase tracking-[0.2em]">Luminosity</p>
                <p className="text-lg font-mono text-indigo-300">{telemetry.avgEnergy.toFixed(4)}</p>
              </div>
            </div>
          </section>
        </div>

        <footer className="p-10 border-t border-white/5 bg-black/40 flex items-center justify-between opacity-20 text-[9px] font-mono uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2"><Cpu size={12} /> {gpuStatus}</span>
        </footer>
      </aside>

      <main className="flex-1 relative bg-[#010103] cursor-grab active:cursor-grabbing" onMouseDown={() => isDragging.current = true} onMouseMove={handleMouseMove} onMouseUp={() => isDragging.current = false} onMouseLeave={() => isDragging.current = false}>
        <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-10 left-10 p-4 bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-2xl hover:bg-indigo-600 transition-all shadow-2xl group pointer-events-auto">
          {isSidebarOpen ? <ChevronLeft size={20} className="text-slate-400 group-hover:text-white"/> : <ChevronRight size={20} className="text-indigo-400 group-hover:text-white"/>}
        </button>
        <div className="absolute top-10 right-10 flex flex-col gap-4 pointer-events-none">
          <div className="px-5 py-2.5 bg-black/60 backdrop-blur border border-white/5 rounded-full flex items-center gap-3">
            <Maximize size={12} className="text-indigo-500 opacity-50" />
            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-[0.4em]">Hybrid_Observatory_Active</span>
          </div>
        </div>
        <div className="absolute bottom-12 right-12 text-[10px] font-mono text-slate-800 uppercase tracking-[3em] pointer-events-none opacity-30 v-text">TOPOLOGY_ENGINE_V4.4.3</div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .v-text { writing-mode: vertical-rl; }
        .custom-scroll::-webkit-scrollbar { width: 3px; } 
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
      `}} />
    </div>
  );
}