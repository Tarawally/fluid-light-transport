import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Activity, Scale, ChevronLeft, ChevronRight, Waypoints, 
  Zap, ShieldAlert, Cpu, Share2, BarChart3, Binary, RefreshCw, Move, Maximize, Target, Gauge, Palette, Wind, Hash, Layout, StretchHorizontal, Boxes, History as LucideHistory, ActivitySquare, Fingerprint
} from 'lucide-react';

/**
 * LATTICE FLOW: PHASE 3.7.6
 * COMPUTATIONAL TOPOLOGY ENGINE
 * - Fix: completed truncated JSX and integrated refined CSS for vertical layouts.
 * - Fix: liquidated ReferenceError by strictly scoping handlers and variables.
 * - Fix: resolved React child error by standardising homological metric strings.
 * - Refinement: implemented a precise 160px shader-based barycentre shift.
 * - Logic: density-weighted geometric frustration and 1/d^2 repulsion equilibrium.
 */

const commonStructs = `
    struct Node {
        pos: vec3<f32>,
        energy: f32,
        vel: vec3<f32>,
        frustration: f32, 
        stalk: vec2<f32>,
        id: u32,
        _pad: f32,
    };
    struct Params {
        dt: f32, coupling: f32, damping: f32, zoom: f32,
        aspect: f32, time: f32, node_count: f32, edge_count: f32,
        rot_x: f32, rot_y: f32, knot_threshold: f32, phase_velocity: f32,
        sidebar_offset: f32, brittleness: f32, screen_width: f32, _p3: f32,
    };
    struct Telemetry {
        avg_energy: f32, avg_frustration: f32, b1_cycles: f32, b0_components: f32,
        knot_density: f32, entropy: f32, _p2: f32, _p3: f32,
    };
    fn to_lorentz(u: vec2<f32>) -> vec3<f32> {
        let u2 = dot(u, u);
        let denom = max(0.08, 1.0 - u2);
        return vec3<f32>((1.0 + u2) / denom, 2.0 * u.x / denom, 2.0 * u.y / denom);
    }
    fn from_lorentz(x: vec3<f32>) -> vec2<f32> {
        return x.yz / max(1.1, x.x + 1.0);
    }
    fn pcg_hash(input: u32) -> u32 {
        var state = input * 747796405u + 2891336453u;
        var word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
        return (word >> 22u) ^ word;
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
        var f_accum = 0.0;
        let start = edge_pointers[id];
        let end = edge_pointers[id + 1];
        let local_deg = f32(end - start);
        for (var i = start; i < end; i++) {
            var n_id = edges[i];
            if (n_id == 0xffffffffu) {
                let hash = pcg_hash(id ^ u32(p.time * 1000.0) ^ i);
                if ((hash % 1800u) < 1u) { edges[i] = hash % u32(p.node_count); }
                continue; 
            }
            let neighbor = nodes_in[n_id];
            let d_vec = neighbor.pos - n.pos;
            let dist = max(0.08, length(d_vec));
            let similarity = dot(n.stalk, neighbor.stalk);
            
            // Equilibrium mechanics: repulsion vs tension
            let repulsion = 0.045 / (dist * dist);
            let tension = (dist - 1.45) * (0.05 + similarity * 0.025);
            force += (d_vec / dist) * (tension - repulsion);
            
            let diff_v = from_lorentz(to_lorentz(neighbor.stalk) - to_lorentz(n.stalk));
            f_accum += length(diff_v);
            if (length(diff_v) > p.brittleness && p.time > 15.0) { edges[i] = 0xffffffffu; }
        }
        let ts = clamp(p.dt, 0.0, 0.016);
        n.vel = (n.vel + force * ts) * (1.0 - p.damping);
        n.pos += n.vel * ts;
        n.pos *= 0.9982;
        // Density-weighted frustration
        n.frustration = f_accum / max(1.0, local_deg);
        nodes_out[id] = n;
    }
`;

const telemetryShaderSource = `
    ${commonStructs}
    @group(0) @binding(0) var<uniform> p: Params;
    @group(0) @binding(1) var<storage, read_write> nodes: array<Node>;
    @group(0) @binding(2) var<storage, read_write> tel: Telemetry;
    @group(0) @binding(3) var<storage, read> edges: array<u32>;
    @group(0) @binding(4) var<storage, read> edge_pointers: array<u32>;
    var<workgroup> shared_e: array<f32, 64>;
    var<workgroup> shared_f: array<f32, 64>;
    var<workgroup> shared_k: array<f32, 64>;
    var<workgroup> shared_roots: array<u32, 64>;
    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>) {
        let id = gid.x;
        let node_count = u32(p.node_count);
        var parent = id;
        if (id < node_count) {
            parent = nodes[id].id;
            let start = edge_pointers[id];
            let end = edge_pointers[id + 1];
            for (var i = start; i < end; i++) {
                let neighbor_id = edges[i];
                if (neighbor_id != 0xffffffffu) { parent = min(parent, nodes[neighbor_id].id); }
            }
            nodes[id].id = parent;
        }
        storageBarrier();
        var is_root = 0u; var energy = 0.0; var frustration = 0.0; var is_knot = 0.0;
        if (id < node_count) {
            if (nodes[id].id == id) { is_root = 1u; }
            energy = nodes[id].energy; frustration = nodes[id].frustration;
            if (frustration > p.knot_threshold) { is_knot = 1.0; }
        }
        shared_e[lid.x] = energy; shared_f[lid.x] = frustration;
        shared_k[lid.x] = is_knot; shared_roots[lid.x] = is_root;
        workgroupBarrier();
        for (var stride = 32u; stride > 0u; stride >>= 1u) {
            if (lid.x < stride) {
                shared_e[lid.x] += shared_e[lid.x + stride];
                shared_f[lid.x] += shared_f[lid.x + stride];
                shared_k[lid.x] += shared_k[lid.x + stride];
                shared_roots[lid.x] += shared_roots[lid.x + stride];
            }
            workgroupBarrier();
        }
        if (lid.x == 0u && gid.x < 64u) {
            let b0 = f32(shared_roots[0]);
            let p_avg = max(0.001, shared_f[0] / 64.0);
            let alpha = 0.15;
            tel.avg_energy = mix(tel.avg_energy, shared_e[0] / 64.0, alpha);
            tel.avg_frustration = mix(tel.avg_frustration, p_avg, alpha);
            tel.b1_cycles = mix(tel.b1_cycles, max(0.0, p.edge_count - p.node_count + b0), alpha);
            tel.b0_components = mix(tel.b0_components, b0, alpha);
            tel.knot_density = mix(tel.knot_density, (shared_k[0] / 64.0) * 100.0, alpha);
            tel.entropy = mix(tel.entropy, -p_avg * log(p_avg + 0.001), alpha);
        }
    }
`;

const renderShaderSource = `
    ${commonStructs}
    @group(0) @binding(0) var<storage, read> nodes: array<Node>;
    @group(0) @binding(1) var<uniform> p: Params;
    struct VOut { @builtin(position) pos: vec4<f32>, @location(0) uv: vec2<f32>, @location(1) energy: f32, @location(2) stalk: vec2<f32>, @location(3) depth: f32, @location(4) is_fragment: f32 };
    @vertex
    fn v_main(@builtin(vertex_index) v: u32, @builtin(instance_index) i: u32) -> VOut {
        let n = nodes[i]; 
        let quad = array<vec2<f32>, 4>(vec2(-1.,-1.), vec2(1.,-1.), vec2(-1.,1.), vec2(1.,1.));
        var uv = quad[v]; var pos = n.pos;
        let cx = cos(p.rot_x); let sx = sin(p.rot_x); let cy = cos(p.rot_y); let sy = sin(p.rot_y);
        let py = pos.y * cy - pos.z * sy; let pz_t = pos.y * sy + pos.z * cy; pos.y = py; pos.z = pz_t;
        let px = pos.x * cx - pos.z * sx; let pz = pos.x * sx + pos.z * cx; pos.x = px; pos.z = pz;
        let v_mag = length(n.vel); let v_dir = normalize(n.vel + vec3(0.0001));
        if (v > 1u) { pos += v_dir * v_mag * 0.2; }
        let w = max(1.0, pos.z + 14.0); let size = (0.05 + n.energy * 0.22) * p.zoom;
        var out: VOut;
        let x_shift = (p.sidebar_offset / p.screen_width) * 2.0;
        out.pos = vec4<f32>((pos.x * p.zoom / w / p.aspect) + (uv.x * size / p.aspect) + x_shift, (pos.y * p.zoom / w) + (uv.y * size), 0.0, 1.0);
        out.uv = uv; out.energy = n.energy; out.stalk = n.stalk; out.depth = 1.0 / w;
        out.is_fragment = f32(n.id > 0u);
        return out;
    }
    fn oklab_to_linear(L: f32, a: f32, b: f32) -> vec3<f32> {
        let l_ = L + 0.3963377774 * a + 0.2158037573 * b; let m_ = L - 0.1055613458 * a - 0.0638541728 * b; let s_ = L - 0.0894841775 * a - 1.2914855480 * b;
        let l = l_ * l_ * l_; let m = m_ * m_ * m_; let s = s_ * s_ * s_;
        return vec3<f32>(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
    }
    @fragment
    fn f_main(in: VOut) -> @location(0) vec4<f32> {
        let d = length(in.uv); if (d > 1.0) { discard; }
        let angle = atan2(in.stalk.y, in.stalk.x); var chrom = 0.12 + in.energy * 0.05; var L = 0.65 + in.energy * 0.25;
        if (in.is_fragment > 0.5) { chrom *= 0.2; L = min(1.0, L + 0.1); }
        let lin_rgb = oklab_to_linear(L, cos(angle) * chrom, sin(angle) * chrom);
        let glow = min(2.8, in.energy * 10.0); 
        let alpha = (1.0 - d) * (0.35 + glow * 0.4) * in.depth;
        return vec4<f32>(pow(max(lin_rgb * (0.24 + glow), vec3(0.0)), vec3(1.0 / 2.2)), alpha);
    }
`;

class SeededRandom {
    constructor(seed) { this.state = seed % 4294967296; }
    next() { this.state = (this.state * 1664525 + 1013904223) % 4294967296; return this.state / 4294967296; }
}

const InstrumentSlider = ({ label, value, min, max, step, onChange, icon: Icon }) => (
    <div className="space-y-2 group text-slate-500 hover:text-indigo-400 transition-colors">
        <div className="flex justify-between items-center whitespace-nowrap min-w-0">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 overflow-hidden text-ellipsis">
                {Icon && <Icon size={12} className="opacity-40 flex-shrink-0" />} {label}
            </label>
            <span className="text-[10px] font-mono text-indigo-300/80 bg-indigo-500/5 px-2 py-0.5 rounded border border-white/5 flex-shrink-0 ml-2">{value.toFixed(value < 10 ? 3 : 1)}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-900 rounded-full appearance-none cursor-crosshair accent-indigo-500 shadow-inner" />
    </div>
);

export default function App() {
    const canvasRef = useRef(null);
    const engineRef = useRef({ device: null, context: null, format: null, initialised: false, frameId: null, frameCount: 0, isMapping: false });
    const buffersRef = useRef({ nodesA: null, nodesB: null, params: null, edges: null, edgePointers: null, telemetry: null, staging: null });
    const pipelinesRef = useRef({ compute: null, render: null, telemetry: null });
    const bindGroupsRef = useRef({ computeA: null, computeB: null, renderA: null, renderB: null, telA: null, telB: null });
    
    const [params, setParams] = useState({ coupling: 6.8, damping: 0.045, zoom: 9.0, aspect: 1.0, node_count: 512, dt: 0.016, knot_threshold: 0.75, phase_velocity: 1.0, seed: 128, brittleness: 1.15 });
    const [telemetry, setTelemetry] = useState({ frustration: 0, b1_cycles: 0, b0_components: 0, knotDensity: 0, entropy: 0 });
    const [topologyHistory, setTopologyHistory] = useState([]);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [error, setError] = useState(null);
    
    const paramsRef = useRef(params);
    const rotationRef = useRef(rotation);
    const sidebarOffsetRef = useRef(0);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e) => { 
        if (!engineRef.current.initialised) return;
        isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; 
    }, []);

    const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging.current || !engineRef.current.initialised) return;
        const dx = (e.clientX - lastPos.current.x) * 0.008; 
        const dy = (e.clientY - lastPos.current.y) * 0.008;
        setRotation(prev => ({ x: prev.x + dx, y: prev.y + dy })); 
        lastPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleWheel = useCallback((e) => { 
        setParams(prev => ({ ...prev, zoom: Math.max(0.5, Math.min(35, prev.zoom - e.deltaY * 0.01)) })); 
    }, []);

    useEffect(() => { paramsRef.current = params; }, [params]);
    useEffect(() => { rotationRef.current = rotation; }, [rotation]);
    useEffect(() => { sidebarOffsetRef.current = isSidebarOpen ? 160.0 : 0.0; }, [isSidebarOpen]);

    const reseedManifold = () => {
        const engine = engineRef.current; if (!engine || !engine.initialised) return;
        const rng = new SeededRandom(paramsRef.current.seed); const nodeCount = paramsRef.current.node_count;
        const initialData = new Float32Array(nodeCount * 12);
        for (let i = 0; i < nodeCount; i++) {
            const o = i * 12; initialData[o] = (rng.next() - 0.5) * 14.0; initialData[o+1] = (rng.next() - 0.5) * 14.0; initialData[o+2] = (rng.next() - 0.5) * 14.0;
            initialData[o+8] = (rng.next() - 0.5) * 0.4; initialData[o+9] = (rng.next() - 0.5) * 0.4;
            new Uint32Array(initialData.buffer)[(o + 10) * 4 / 4] = i; 
        }
        engine.device.queue.writeBuffer(buffersRef.current.nodesA, 0, initialData); engine.device.queue.writeBuffer(buffersRef.current.nodesB, 0, initialData);
    };

    useEffect(() => {
        let isMounted = true;
        const initEngine = async () => {
            try {
                const adapter = await navigator.gpu?.requestAdapter();
                if (!adapter || !isMounted) throw new Error("WebGPU context unavailable.");
                const device = await adapter.requestDevice();
                if (!isMounted) { device.destroy(); return; }
                device.lost.then(info => { if (isMounted) setError(`Hardware reset: \${info.message}`); });
                const context = canvasRef.current.getContext('webgpu');
                const format = navigator.gpu.getPreferredCanvasFormat();
                context.configure({ device, format, alphaMode: 'premultiplied' });
                const nodeCount = params.node_count; const nodeSize = 48;
                const nodesA = device.createBuffer({ size: nodeCount * nodeSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
                const nodesB = device.createBuffer({ size: nodeCount * nodeSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
                const paramsBuffer = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
                const telBuffer = device.createBuffer({ size: 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST });
                const stagingBuffer = device.createBuffer({ size: 32, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
                const rng = new SeededRandom(params.seed); const edges = []; const edgePointers = new Uint32Array(nodeCount + 1); let curEdge = 0;
                for (let i = 0; i < nodeCount; i++) {
                    edgePointers[i] = curEdge;
                    const neighbors = [(i + 1) % nodeCount, (i - 1 + nodeCount) % nodeCount, (i + 2) % nodeCount, Math.floor(rng.next() * nodeCount)];
                    const unique = [...new Set(neighbors)];
                    for (const n of unique) { edges.push(n); curEdge++; }
                }
                edgePointers[nodeCount] = curEdge;
                const eBuf = device.createBuffer({ size: edges.length * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
                const pBuf = device.createBuffer({ size: edgePointers.length * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
                device.queue.writeBuffer(eBuf, 0, new Uint32Array(edges)); device.queue.writeBuffer(pBuf, 0, edgePointers);
                const computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: computeShaderSource }), entryPoint: 'main' } });
                const telPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: telemetryShaderSource }), entryPoint: 'main' } });
                const renderPipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module: device.createShaderModule({ code: renderShaderSource }), entryPoint: 'v_main' }, fragment: { module: device.createShaderModule({ code: renderShaderSource }), entryPoint: 'f_main', targets: [{ format, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' } } }] }, primitive: { topology: 'triangle-strip' } });
                const bindCompute = (inB, outB) => device.createBindGroup({ layout: computePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: paramsBuffer } }, { binding: 1, resource: { buffer: inB } }, { binding: 2, resource: { buffer: outB } }, { binding: 3, resource: { buffer: eBuf } }, { binding: 4, resource: { buffer: pBuf } }] });
                const bindTel = (nodeB) => device.createBindGroup({ layout: telPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: paramsBuffer } }, { binding: 1, resource: { buffer: nodeB } }, { binding: 2, resource: { buffer: telBuffer } }, { binding: 3, resource: { buffer: eBuf } }, { binding: 4, resource: { buffer: pBuf } }] });
                const bindRender = (nodesB) => device.createBindGroup({ layout: renderPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: nodesB } }, { binding: 1, resource: { buffer: paramsBuffer } }] });

                const initialData = new Float32Array(nodeCount * 12); const initialRng = new SeededRandom(params.seed);
                for (let i = 0; i < nodeCount; i++) {
                    const o = i * 12; initialData[o] = (initialRng.next() - 0.5) * 14.0; initialData[o+1] = (initialRng.next() - 0.5) * 14.0; initialData[o+2] = (initialRng.next() - 0.5) * 14.0;
                    initialData[o+8] = (initialRng.next() - 0.5) * 0.4; initialData[o+9] = (initialRng.next() - 0.5) * 0.4;
                    new Uint32Array(initialData.buffer)[(o + 10) * 4 / 4] = i; 
                }
                device.queue.writeBuffer(nodesA, 0, initialData);
                if (!isMounted) { device.destroy(); return; }
                const paramsData = new Float32Array(16);
                engineRef.current = { device, context, format, initialised: true, frameCount: 0, isMapping: false };
                buffersRef.current = { nodesA, nodesB, params: paramsBuffer, edges: eBuf, edgePointers: pBuf, telemetry: telBuffer, staging: stagingBuffer };
                pipelinesRef.current = { compute: computePipeline, render: renderPipeline, telemetry: telPipeline };
                bindGroupsRef.current = { computeA: bindCompute(nodesA, nodesB), computeB: bindCompute(nodesB, nodesA), telA: bindTel(nodesB), telB: bindTel(nodesA), renderA: bindRender(nodesB), renderB: bindRender(nodesA) };
                const frame = (t) => {
                    const engine = engineRef.current; if (!engine || !engine.initialised || !isMounted) return;
                    const bg = bindGroupsRef.current; const isOdd = engine.frameCount % 2 === 1; const cP = paramsRef.current; const cR = rotationRef.current;
                    paramsData[0] = cP.dt; paramsData[1] = cP.coupling; paramsData[2] = cP.damping; paramsData[3] = cP.zoom;
                    paramsData[4] = cP.aspect; paramsData[5] = t / 1000; paramsData[6] = cP.node_count; paramsData[7] = edges.length;
                    paramsData[8] = cR.x + (t * 0.0001); paramsData[9] = cR.y; paramsData[10] = cP.knot_threshold; paramsData[11] = cP.phase_velocity;
                    paramsData[12] = sidebarOffsetRef.current; paramsData[13] = cP.brittleness; paramsData[14] = window.innerWidth || 1920;
                    engine.device.queue.writeBuffer(buffersRef.current.params, 0, paramsData);
                    const encoder = engine.device.createCommandEncoder();
                    const cp = encoder.beginComputePass(); cp.setPipeline(pipelinesRef.current.compute); cp.setBindGroup(0, isOdd ? bg.computeB : bg.computeA); cp.dispatchWorkgroups(Math.ceil(nodeCount / 64)); cp.end();
                    const tp = encoder.beginComputePass(); tp.setPipeline(pipelinesRef.current.telemetry); tp.setBindGroup(0, isOdd ? bg.telB : bg.telA); tp.dispatchWorkgroups(1); tp.end();
                    const rp = encoder.beginRenderPass({ colorAttachments: [{ view: engine.context.getCurrentTexture().createView(), clearValue: { r: 0.001, g: 0.001, b: 0.008, a: 1 }, loadOp: 'clear', storeOp: 'store' }] });
                    rp.setPipeline(pipelinesRef.current.render); rp.setBindGroup(0, isOdd ? bg.renderA : bg.renderB); rp.draw(4, nodeCount); rp.end();
                    if (!engine.isMapping && engine.frameCount % 10 === 0) { encoder.copyBufferToBuffer(buffersRef.current.telemetry, 0, buffersRef.current.staging, 0, 32); }
                    engine.device.queue.submit([encoder.finish()]);
                    if (!engine.isMapping && engine.frameCount % 10 === 0) {
                        engine.isMapping = true;
                        buffersRef.current.staging.mapAsync(GPUMapMode.READ).then(() => { 
                            if (isMounted) { 
                                const d = new Float32Array(buffersRef.current.staging.getMappedRange()); 
                                setTelemetry({ frustration: d[1], b1_cycles: d[2], b0_components: d[3], knotDensity: d[4], entropy: d[5] }); 
                                setTopologyHistory(h => [...h.slice(-99), { b1: d[2], b0: d[3] }]);
                            } 
                            buffersRef.current.staging.unmap(); 
                            engine.isMapping = false; 
                        }).catch(() => { engine.isMapping = false; });
                    }
                    engine.frameCount++; engine.frameId = requestAnimationFrame(frame);
                };
                engineRef.current.frameId = requestAnimationFrame(frame);
            } catch (err) { if (isMounted) setError(String(err.message || err)); }
        };
        initEngine();
        const handleResize = () => {
            if (!canvasRef.current || !engineRef.current.initialised) return;
            const dpr = window.devicePixelRatio || 1; const w = window.innerWidth; const h = window.innerHeight;
            canvasRef.current.width = Math.floor(w * dpr); canvasRef.current.height = Math.floor(h * dpr);
            paramsRef.current.aspect = Math.max(0.1, w / h);
            engineRef.current.context.configure({ device: engineRef.current.device, format: engineRef.current.format, alphaMode: 'premultiplied' });
        };
        window.addEventListener('resize', handleResize);
        return () => { 
            isMounted = false; 
            if (engineRef.current) {
                engineRef.current.initialised = false;
                if (engineRef.current.frameId) cancelAnimationFrame(engineRef.current.frameId);
                if (engineRef.current.device) engineRef.current.device.destroy();
            }
            window.removeEventListener('resize', handleResize); 
            const b = buffersRef.current; if (b.nodesA) b.nodesA.destroy(); if (b.nodesB) b.nodesB.destroy(); if (b.params) b.params.destroy(); if (b.edges) b.edges.destroy(); if (b.edgePointers) b.edgePointers.destroy(); if (b.telemetry) b.telemetry.destroy(); if (b.staging) b.staging.destroy();
        };
    }, []);

    if (error) return (
        <div className="h-screen bg-black flex items-center justify-center p-12 font-sans text-slate-400">
            <div className="max-w-md w-full bg-[#08080c] border border-red-500/20 rounded-[2.5rem] p-16 text-center space-y-8 shadow-2xl">
                <ShieldAlert size={56} className="text-red-500 mx-auto opacity-70" /><h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-white">Engine collapse</h2><p className="text-[10px] font-mono opacity-30 italic break-all uppercase tracking-tighter leading-relaxed">{error}</p><button onClick={() => window.location.reload()} className="w-full py-5 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg">Re-Initialise</button>
            </div>
        </div>
    );

    return (
        <div className="relative h-screen bg-black text-slate-300 font-sans overflow-hidden select-none">
            <aside className={`fixed top-0 left-0 h-full bg-slate-950/95 backdrop-blur-3xl border-r border-white/5 z-40 transition-transform duration-500 ease-in-out shadow-2xl overflow-hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '320px' }}>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="p-10 border-b border-white/5 flex items-center gap-5">
                        <div className="w-12 h-12 flex-shrink-0 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40"><Binary size={24} className="text-white" /></div>
                        <div><h1 className="text-[13px] font-black tracking-[0.3em] uppercase text-white whitespace-nowrap">Lattice flow</h1><p className="text-[9px] font-mono uppercase tracking-widest opacity-20 mt-1 whitespace-nowrap">Phase 3.7.6 engine</p></div>
                    </header>
                    <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scroll min-w-0">
                        <section className="space-y-8">
                            <InstrumentSlider label="Sheaf intensity" value={params.coupling} min={0} max={15} step={0.1} icon={Zap} onChange={v => setParams(p => ({...p, coupling: v}))} />
                            <InstrumentSlider label="Brittleness" value={params.brittleness} min={0.5} max={2.5} step={0.01} icon={ShieldAlert} onChange={v => setParams(p => ({...p, brittleness: v}))} />
                            <InstrumentSlider label="Knot sensitivity" value={params.knot_threshold} min={0.1} max={2.5} step={0.01} icon={Target} onChange={v => setParams(p => ({...p, knot_threshold: v}))} />
                            <InstrumentSlider label="State velocity" value={params.phase_velocity} min={0} max={5} step={0.01} icon={Wind} onChange={v => setParams(p => ({...p, phase_velocity: v}))} />
                            <InstrumentSlider label="Graph scale" value={params.zoom} min={1} max={30} step={0.1} icon={Scale} onChange={v => setParams(p => ({...p, zoom: v}))} />
                            <button onClick={reseedManifold} className="w-full py-4 flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:bg-indigo-600 hover:text-white transition-all group">
                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-1000 flex-shrink-0" /> <span className="text-ellipsis overflow-hidden">Reseed manifold</span>
                            </button>
                        </section>
                        <section className="pt-10 border-t border-white/5 space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 flex items-center gap-3"><LucideHistory size={14} /> Persistence mapping</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-1 overflow-hidden"><p className="text-[7px] font-bold opacity-30 uppercase tracking-[0.2em]">B0 (Components)</p><p className="text-lg font-mono text-emerald-400">{Math.floor(telemetry.b0_components).toString()}</p></div>
                                <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-1 overflow-hidden"><p className="text-[7px] font-bold opacity-30 uppercase tracking-[0.2em]">B1 (Cycles)</p><p className="text-lg font-mono text-indigo-400">{Math.floor(telemetry.b1_cycles).toString()}</p></div>
                                <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-1 overflow-hidden"><p className="text-[7px] font-bold opacity-30 uppercase tracking-[0.2em]">Frustration</p><p className="text-lg font-mono text-white">{telemetry.frustration.toFixed(3)}</p></div>
                                <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-1 overflow-hidden"><p className="text-[7px] font-bold opacity-30 uppercase tracking-[0.2em]">Entropy</p><p className="text-lg font-mono text-indigo-300">{telemetry.entropy.toFixed(3)}</p></div>
                            </div>
                            <div className="h-12 flex items-end gap-1 px-1">
                                {topologyHistory.map((h, i) => (
                                    <div key={i} className="flex-1 bg-indigo-500/20 rounded-t" style={{ height: `${Math.min(100, (h.b1 / params.node_count) * 200)}%` }} />
                                ))}
                            </div>
                        </section>
                    </div>
                    <footer className="p-10 border-t border-white/5 bg-black/40 flex items-center justify-between opacity-20 text-[9px] font-mono uppercase tracking-[0.2em] mt-auto">
                        <span className="flex items-center gap-2 whitespace-nowrap overflow-hidden"><Cpu size={12} className="flex-shrink-0" /> GPU active</span><span>60 Hz</span>
                    </footer>
                </div>
            </aside>
            <main className="absolute inset-0 bg-slate-950 cursor-grab active:cursor-grabbing overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} onTouchStart={e => handleMouseDown(e.touches[0])} onTouchMove={e => handleMouseMove(e.touches[0])} onTouchEnd={handleMouseUp}>
                <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-10 left-10 p-4 bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-2xl hover:bg-indigo-600 transition-all shadow-2xl group pointer-events-auto z-50">
                    {isSidebarOpen ? <ChevronLeft size={20} className="text-slate-400 group-hover:text-white"/> : <ChevronRight size={20} className="text-indigo-400 group-hover:text-white"/>}
                </button>
                <div className="absolute top-10 right-10 flex gap-4 pointer-events-none">
                    <div className="px-5 py-2.5 bg-black/60 backdrop-blur border border-white/5 rounded-full flex items-center gap-3"><ActivitySquare size={12} className="text-indigo-500 opacity-50" /><span className="text-[9px] font-mono text-indigo-400 uppercase tracking-[0.4em]">Stochastic_Entropy_Stabilised</span></div>
                </div>
                <div className="absolute bottom-12 right-12 text-[10px] font-mono text-slate-800 uppercase tracking-[2.8em] pointer-events-none opacity-30 v-text">TOPOLOGY_ENGINE_V3.7.6</div>
                <div className="absolute bottom-10 left-10 flex gap-6 opacity-40 pointer-events-none">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Resonance</span>
                        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min(100, telemetry.entropy * 200)}%` }} />
                        </div>
                    </div>
                </div>
            </main>
            <style dangerouslySetInnerHTML={{ __html: `
                .v-text { 
                    writing-mode: vertical-rl; 
                    transform: rotate(180deg);
                    height: 300px;
                }
                .custom-scroll::-webkit-scrollbar { width: 4px; } 
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { 
                    background: rgba(99, 102, 241, 0.1); 
                    border-radius: 10px; 
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
                input[type='range']::-webkit-slider-thumb {
                    -webkit-appearance: none; width: 16px; height: 16px;
                    background: #6366f1; border-radius: 50%; cursor: pointer;
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
                }
                canvas { touch-action: none; }
            `}} />
        </div>
    );
}