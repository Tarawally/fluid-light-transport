import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Settings2, Activity, Eye, Cpu, Database, LineChart, History, Target } from 'lucide-react';

// --- Wgsl shader definitions ---

const initWGSL = `
    struct InitParams {
        seed: u32,
        width: f32,
        height: f32,
        seedType: f32,
    };
    @group(0) @binding(0) var<uniform> params: InitParams;
    @group(0) @binding(1) var stateOut: texture_storage_2d<rgba32float, write>;

    fn pcg32_hash(seed: u32) -> u32 {
        var state = seed * 747796405u + 2891336453u;
        var word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
        return (word >> 22u) ^ word;
    }

    fn random_float(seed: ptr<function, u32>) -> f32 {
        *seed = pcg32_hash(*seed);
        return f32(*seed) / 4294967296.0;
    }

    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) id : vec3<u32>) {
        let coord = vec2<i32>(i32(id.x), i32(id.y));
        let dim = vec2<i32>(i32(params.width), i32(params.height));
        if (coord.x >= dim.x || coord.y >= dim.y) { return; }

        var local_seed = pcg32_hash(u32(coord.y * dim.x + coord.x) + params.seed);
        
        let cx = f32(dim.x) * 0.5;
        let cy = f32(dim.y) * 0.5;
        let x = f32(coord.x);
        let y = f32(coord.y);
        let dx = x - cx;
        let dy = y - cy;
        let dist = sqrt(dx*dx + dy*dy);
        
        var mag = 0.0;
        var ph = 0.0;
        var is_active = false;
        let initRadius = min(params.width, params.height) * 0.15;
        let st = i32(params.seedType);

        if (st == 0 && dist < initRadius) {
            mag = random_float(&local_seed) * 0.5 + 0.3;
            ph = (dist / initRadius) * 6.28318 + (random_float(&local_seed) - 0.5);
            is_active = true;
        } else if (st == 1) {
            mag = random_float(&local_seed) * 0.8;
            ph = random_float(&local_seed) * 6.28318;
            is_active = true;
        } else if (st == 2 && abs(dist - initRadius * 1.5) < 15.0) {
            mag = random_float(&local_seed) * 0.5 + 0.3;
            ph = atan2(dy, dx) * 6.0 + (random_float(&local_seed) - 0.5);
            is_active = true;
        } else if (st == 3) {
            let theta = 0.785398; 
            let lambda = 12.0;
            let gamma = 0.6;
            let sigmaG = initRadius * 0.5;
            let xP = dx * cos(theta) + dy * sin(theta);
            let yP = -dx * sin(theta) + dy * cos(theta);
            let envelope = exp(-(xP*xP + gamma*gamma * yP*yP) / (2.0 * sigmaG*sigmaG));
            let carrier = cos(6.28318 * xP / lambda);
            mag = envelope * abs(carrier) * 0.9;
            if (carrier > 0.0) { ph = theta; } else { ph = theta + 3.14159; }
            is_active = mag > 0.05;
        }

        var q = vec2<f32>(0.0);
        var p = vec2<f32>(0.0);
        if (is_active) {
            q = vec2<f32>(cos(ph) * mag, sin(ph) * mag);
            p = vec2<f32>(0.0, 0.0);
        }

        textureStore(stateOut, coord, vec4<f32>(q.x, q.y, p.x, p.y));
    }
`;

const macroWGSL = `
    struct MacroParams {
        width: f32,
        height: f32,
        pad1: f32,
        pad2: f32,
    };
    @group(0) @binding(0) var<uniform> params: MacroParams;
    @group(0) @binding(1) var stateIn: texture_2d<f32>;
    @group(0) @binding(2) var macroOut: texture_storage_2d<rgba32float, write>;

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id : vec3<u32>) {
        let macro_coord = vec2<i32>(i32(id.x), i32(id.y));
        let macro_dim = vec2<i32>(i32(params.width) / 16, i32(params.height) / 16);
        if (macro_coord.x >= macro_dim.x || macro_coord.y >= macro_dim.y) { return; }

        var sum_z = vec2<f32>(0.0);
        let base_x = macro_coord.x * 16;
        let base_y = macro_coord.y * 16;

        for (var dy = 0; dy < 16; dy++) {
            for (var dx = 0; dx < 16; dx++) {
                let coord = vec2<i32>(base_x + dx, base_y + dy);
                let z = textureLoad(stateIn, coord, 0).xy;
                sum_z += z;
            }
        }
        
        let born_intensity = dot(sum_z, sum_z) / 256.0;
        
        textureStore(macroOut, macro_coord, vec4<f32>(born_intensity, sum_z.x, sum_z.y, 1.0));
    }
`;

const computeWGSL = `
    struct Params {
        dt: f32, radius: f32, phaseShift: f32, mu: f32, sigma: f32, cooling: f32, mouseX: f32, mouseY: f32, mouseRadius: f32, resolutionX: f32, resolutionY: f32, timeDirection: f32, topology: f32, mouseVelX: f32, mouseVelY: f32, kernelType: f32, latentInterference: f32, time: f32, feedbackStrength: f32, adaptiveConv: f32,
    };
    @group(0) @binding(0) var<uniform> params: Params;
    @group(0) @binding(1) var stateIn: texture_2d<f32>;
    @group(0) @binding(2) var macroIn: texture_2d<f32>;
    @group(0) @binding(3) var stateOut: texture_storage_2d<rgba32float, write>;

    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
        let coord = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
        let dimensions = vec2<i32>(i32(params.resolutionX), i32(params.resolutionY));
        if (coord.x >= dimensions.x || coord.y >= dimensions.y) { return; }
 
        let state_val = textureLoad(stateIn, coord, 0);
        let q_old = state_val.xy;
        let p_old = state_val.zw;
        
        let macro_coord = vec2<i32>(coord.x / 16, coord.y / 16);
        let macro_val = textureLoad(macroIn, macro_coord, 0);
        let born_intensity = macro_val.x;
        
        var effective_radius = params.radius;
        if (params.adaptiveConv > 0.0) {
            let local_entropy = max(0.0, 1.0 - born_intensity);
            effective_radius = max(2.0, params.radius * (1.0 - (local_entropy * params.adaptiveConv)));
        }
        
        var z_sum = vec2<f32>(0.0);
        var z_sum_inner = vec2<f32>(0.0);
        var weight_sum = 0.0;
        var weight_sum_inner = 0.0;
        
        let r = i32(effective_radius);
        let step_val = max(1, r / 8); 

        for (var y = -r; y <= r; y += step_val) {
            for (var x = -r; x <= r; x += step_val) {
                let offset = vec2<i32>(x, y);
                let neighbor_coord = (coord + offset + dimensions) % dimensions;
                var dist = 0.0;
                
                if (params.topology > 0.5) {
                    let uv_center = (vec2<f32>(f32(coord.x), f32(coord.y)) / vec2<f32>(params.resolutionX, params.resolutionY)) * 2.0 - 1.0;
                    var u = uv_center;
                    if (length(u) > 0.98) { u = u * (0.98 / length(u)); }
                    
                    let uv_neighbor = (vec2<f32>(f32(neighbor_coord.x), f32(neighbor_coord.y)) / vec2<f32>(params.resolutionX, params.resolutionY)) * 2.0 - 1.0;
                    var v = uv_neighbor;
                    if (length(v) > 0.98) { v = v * (0.98 / length(v)); }
                    let num = 2.0 * dot(u - v, u - v);
                    let den = max(1e-6, (1.0 - dot(u, u)) * (1.0 - dot(v, v)));
                    let arg = max(1.0, 1.0 + num / den);
                    let hyp_dist = log(arg + sqrt(arg * arg - 1.0));
                    dist = hyp_dist * (params.resolutionX * 0.1); 
                } else {
                    dist = length(vec2<f32>(f32(x), f32(y)));
                }

                if (dist <= effective_radius) {
                    let neighbor_q = textureLoad(stateIn, neighbor_coord, 0).xy;
                    let weight = exp(-(dist * dist) / (effective_radius * effective_radius * 0.5));
                    z_sum += neighbor_q * weight;
                    weight_sum += weight;
                    if (params.kernelType > 0.5) {
                        let inner_r = effective_radius * 0.33;
                        let inner_weight = exp(-(dist * dist) / (inner_r * inner_r * 0.5));
                        z_sum_inner += neighbor_q * inner_weight;
                        weight_sum_inner += inner_weight;
                    }
                }
            }
        }
        
        z_sum = z_sum / max(1e-6, weight_sum);
        if (params.kernelType > 0.5) {
            z_sum = (z_sum_inner / max(1e-6, weight_sum_inner)) - z_sum;
        }

        let theta = params.phaseShift + (born_intensity * params.feedbackStrength);
        let cs = cos(theta);
        let sn = sin(theta);
        let unitary_q = vec2<f32>(
            cs * z_sum.x - sn * z_sum.y,
            sn * z_sum.x + cs * z_sum.y
        );

        let force = unitary_q - q_old;
        let current_dt = params.dt;
        
        var p_new = p_old + force * current_dt;
        var q_new = q_old + p_new * current_dt;

        let q_r = textureLoad(stateIn, vec2<i32>((coord.x + 1) % dimensions.x, coord.y), 0).xy;
        let q_l = textureLoad(stateIn, vec2<i32>((coord.x - 1 + dimensions.x) % dimensions.x, coord.y), 0).xy;
        let q_u = textureLoad(stateIn, vec2<i32>(coord.x, (coord.y - 1 + dimensions.y) % dimensions.y), 0).xy;
        let q_d = textureLoad(stateIn, vec2<i32>(coord.x, (coord.y + 1) % dimensions.y), 0).xy;
        
        let z_parity = q_r.x * q_l.x * q_u.x * q_d.x;
        if (z_parity < -0.01) {
            q_new = vec2<f32>(q_new.y, q_new.x);
        }

        let f_coord = vec2<f32>(f32(coord.x), f32(coord.y));
        if (params.latentInterference > 0.0) {
            let latent_phase = sin(f_coord.x * 0.02 + params.time) * cos(f_coord.y * 0.02 - params.time * 0.5);
            q_new += vec2<f32>(cos(latent_phase), sin(latent_phase)) * params.latentInterference * params.dt;
        }

        let mouse_pos = vec2<f32>(params.mouseX, params.mouseY);
        let dist_to_mouse = length(f_coord - mouse_pos);
        if (params.mouseRadius > 0.0 && dist_to_mouse < params.mouseRadius) {
            let disturbance = vec2<f32>(cos(params.time), sin(params.time)) * 0.5;
            q_new = mix(q_new, disturbance, 0.5);
            p_new = vec2<f32>(0.0);
        }

        textureStore(stateOut, coord, vec4<f32>(q_new.x, q_new.y, p_new.x, p_new.y));
    }
`;

const renderWGSL = `
    struct RenderParams {
        exposure: f32, contourFreq: f32, isoclineAlpha: f32, projection: f32, colorMode: f32, renormScale: f32, time: f32, pad2: f32,
    };
    @group(0) @binding(0) var<uniform> rParams: RenderParams;
    @group(0) @binding(1) var stateTex: texture_2d<f32>;
    @group(0) @binding(2) var macroTex: texture_2d<f32>;

    struct VertexOutput { @builtin(position) position: vec4<f32>, @location(0) uv: vec2<f32> };

    @vertex
    fn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
        var pos = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
        var output: VertexOutput;
        output.position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        output.uv = pos[VertexIndex] * 0.5 + 0.5;
        output.uv.y = 1.0 - output.uv.y;
        return output;
    }

    fn hsv2rgb(c: vec3<f32>) -> vec3<f32> {
        let K = vec4<f32>(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        let p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), c.y);
    }

    @fragment
    fn frag_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
        if (rParams.projection > 1.5) {
            let aspect = f32(textureDimensions(stateTex).x) / f32(textureDimensions(stateTex).y);
            var uv_c = uv * 2.0 - 1.0;
            uv_c.x *= aspect;
            
            let cam_time = rParams.time * 0.1;
            let ro = vec3<f32>(cos(cam_time) * 1.8, sin(cam_time) * 1.8, 1.2);
            let look_at = vec3<f32>(0.0, 0.0, 0.0);
            let ww = normalize(look_at - ro);
            let uu = normalize(cross(ww, vec3<f32>(0.0, 0.0, 1.0)));
            let vv = normalize(cross(uu, ww));
            let rd = normalize(uv_c.x * uu + uv_c.y * vv + 1.5 * ww);
            
            var t_dist = 0.0;
            var color = vec3<f32>(0.0);
            var transmittance = 1.0;
            let macro_dim = vec2<f32>(textureDimensions(macroTex));
            let state_dim = vec2<f32>(textureDimensions(stateTex));
            
            for(var i=0; i<150; i++) {
                let p_vol = ro + rd * t_dist;
                if (abs(p_vol.x) > 1.0 || abs(p_vol.y) > 1.0 || abs(p_vol.z) > 0.5) {
                    t_dist += 0.05;
                    continue;
                }
                
                let s_uv = p_vol.xy * 0.5 + 0.5;
                let macro_coord = vec2<i32>(s_uv * macro_dim);
                let born_intensity = textureLoad(macroTex, macro_coord, 0).x;
                
                if (born_intensity < 0.0001) {
                    t_dist += 0.05;
                    continue;
                }
                
                let tex_coord = vec2<i32>(s_uv * state_dim);
                let state = textureLoad(stateTex, tex_coord, 0);
                let q = state.xy;
                
                let mag = length(q);
                let local_density = exp(-pow(p_vol.z * 4.0, 2.0)) * mag;
                
                if (local_density > 0.05) {
                    let ph = atan2(q.y, q.x);
                    let hue = (ph / (2.0 * 3.14159)) + 0.5;
                    let emission = hsv2rgb(vec3<f32>(hue, 0.8 + 0.2 * sin(ph * 4.0), local_density * rParams.exposure * 2.0));
                    
                    let step_len = 0.02;
                    let sigma_t = local_density * 2.0;
                    let dt_step = exp(-sigma_t * step_len);
                    color += emission * (1.0 - dt_step) * transmittance;
                    transmittance *= dt_step;
                    
                    if (transmittance < 0.01) { break; }
                    t_dist += step_len;
                } else {
                    t_dist += 0.02;
                }
            }
            return vec4<f32>(color, 1.0);
        }

        var s_uv = uv;
        if (rParams.projection > 0.5 && rParams.projection < 1.5) {
            let c = uv * 2.0 - 1.0;
            let r2 = dot(c, c);
            if (r2 > 1.0) { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }
            s_uv = fract((c / (1.0 - r2)) * 0.15 + 0.5);
        }

        let dim = vec2<f32>(textureDimensions(stateTex));
        let ren = i32(max(1.0, rParams.renormScale));
        let b_c = vec2<i32>(s_uv * dim);
        var z_s = vec2<f32>(0.0);
        for (var ry = 0; ry < 8; ry++) {
            if (ry >= ren) { break; }
            for (var rx = 0; rx < 8; rx++) {
                if (rx >= ren) { break; }
                let coord = clamp(vec2<i32>((b_c.x/ren)*ren + rx, (b_c.y/ren)*ren + ry), vec2<i32>(0), vec2<i32>(dim)-1);
                z_s += textureLoad(stateTex, coord, 0).xy;
            }
        }
        let z = z_s / f32(ren * ren);
        let mag = length(z);
        let ph = atan2(z.y, z.x);
        let hue = (ph / (2.0 * 3.14159)) + 0.5;
        let val = 1.0 - exp(-mag * rParams.exposure);
        var rgb = vec3<f32>(0.0);

        if (rParams.colorMode < 0.5) {
            let sat = 0.5 + 0.5 * sin(mag * rParams.contourFreq * 3.14159);
            rgb = hsv2rgb(vec3<f32>(hue, sat, val));
            let line = smoothstep(0.0, 0.1, fract(ph * 4.0/3.14159)) * smoothstep(1.0, 0.9, fract(ph * 4.0/3.14159));
            rgb = mix(rgb, rgb * line, rParams.isoclineAlpha);
        } else if (rParams.colorMode < 1.5) {
            rgb = mix(vec3<f32>(0.0, 0.0, 0.1), vec3<f32>(1.0, 1.0, 0.8), pow(clamp(mag * rParams.exposure * 0.5, 0.0, 1.0), 2.0));
        } else if (rParams.colorMode < 2.5) {
            rgb = vec3<f32>(smoothstep(0.2, 0.8, sin(ph * 12.0) * 0.5 + 0.5) * val);
        } else {
            let c_px = vec2<i32>(s_uv * dim);
            let ph_r = atan2(textureLoad(stateTex, clamp(c_px + vec2<i32>(1,0), vec2<i32>(0), vec2<i32>(dim)-1), 0).y, textureLoad(stateTex, clamp(c_px + vec2<i32>(1,0), vec2<i32>(0), vec2<i32>(dim)-1), 0).x);
            let ph_u = atan2(textureLoad(stateTex, clamp(c_px + vec2<i32>(0,1), vec2<i32>(0), vec2<i32>(dim)-1), 0).y, textureLoad(stateTex, clamp(c_px + vec2<i32>(0,1), vec2<i32>(0), vec2<i32>(dim)-1), 0).x);
            let curv = abs(ph_r - ph) + abs(ph_u - ph);
            rgb = mix(vec3<f32>(0.0), vec3<f32>(0.2, 0.6, 1.0), clamp(curv * 0.5, 0.0, 1.0)) * val;
        }
        return vec4<f32>(rgb, 1.0);
    }
`;

// --- Web worker definition ---
const workerScript = `
    let device = null;
    let context = null;
    let format = null;
    let initPipeline = null, macroPipeline = null, computePipeline = null, renderPipeline = null;
    let paramsBuffer = null, initParamsBuffer = null, macroParamsBuffer = null, renderParamsBuffer = null;
    let texA = null, texB = null, macroTex = null;
    let width = 0, height = 0, stepIdx = 0, frameId = 0, isPlaying = true;
    
    let isRecording = false, telemetryHistory = [], interactionBuffer = [], telemetryInterval = 60, autoPauseLimit = 0, lastTelemetryStep = -1;
    let currentRegime = "chaotic equilibrium";

    let currentParams = {
        dt: 0.05, radius: 12.0, phase: 0.618, mu: 0.28, sigma: 0.045, cooling: 0.01,
        mouseX: -1, mouseY: -1, mouseRadius: 0, timeDirection: 1, topology: 0,
        mouseVelX: 0, mouseVelY: 0, kernelType: 0, latentInterference: 0,
        exposure: 1.2, contour: 5.0, isocline: 0.3, projection: 0, colormap: 0, renorm: 1,
        feedback: 0, adaptiveConv: 0.0, sweepActive: 0.0, masterSeed: 12345
    };

    async function initializeWebGPU(canvas) {
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
        device = await adapter.requestDevice();
        context = canvas.getContext('webgpu');
        format = navigator.gpu.getPreferredCanvasFormat();
        width = canvas.width; height = canvas.height;
        context.configure({ device, format, alphaMode: 'premultiplied' });

        paramsBuffer = device.createBuffer({ size: 20 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        initParamsBuffer = device.createBuffer({ size: 4 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        macroParamsBuffer = device.createBuffer({ size: 4 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        renderParamsBuffer = device.createBuffer({ size: 8 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

        const texCfg = { size: [width, height, 1], format: 'rgba32float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC };
        texA = device.createTexture(texCfg); texB = device.createTexture(texCfg);
        
        const macroDimX = Math.ceil(width / 16);
        const macroDimY = Math.ceil(height / 16);
        macroTex = device.createTexture({ size: [macroDimX, macroDimY, 1], format: 'rgba32float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING });

        initPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: self.shaders.initWGSL }), entryPoint: 'main' } });
        macroPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: self.shaders.macroWGSL }), entryPoint: 'main' } });
        computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: self.shaders.computeWGSL }), entryPoint: 'main' } });
        renderPipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module: device.createShaderModule({ code: self.shaders.renderWGSL }), entryPoint: 'vert_main' }, fragment: { module: device.createShaderModule({ code: self.shaders.renderWGSL }), entryPoint: 'frag_main', targets: [{ format }] }, primitive: { topology: 'triangle-list' } });

        seedField(0);
        loop();
    }

    function seedField(seedTypeIndex) {
        stepIdx = 0; telemetryHistory = []; interactionBuffer = []; lastTelemetryStep = -1;
        const seedToUse = u32(currentParams.masterSeed || Math.floor(Math.random() * 4294967296));
        device.queue.writeBuffer(initParamsBuffer, 0, new Uint32Array([seedToUse]));
        device.queue.writeBuffer(initParamsBuffer, 4, new Float32Array([width, height, seedTypeIndex]));
        
        const encoder = device.createCommandEncoder();
        const initPass = (tex) => {
            const pass = encoder.beginComputePass(); pass.setPipeline(initPipeline);
            pass.setBindGroup(0, device.createBindGroup({ layout: initPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: initParamsBuffer } }, { binding: 1, resource: tex.createView() }] }));
            pass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16)); pass.end();
        };
        initPass(texA); initPass(texB);
        device.queue.submit([encoder.finish()]);
        currentRegime = "macroscopic order";
    }

    function wrapPhase(ph) {
        let res = ph % (2 * Math.PI);
        if (res > Math.PI) res -= 2 * Math.PI;
        else if (res < -Math.PI) res += 2 * Math.PI;
        return res;
    }

    async function executeTelemetryReduction() {
        const bPP = 16, align = 256, bPR = Math.ceil((width * bPP) / align) * align;
        const staging = device.createBuffer({ size: bPR * height, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
        const encoder = device.createCommandEncoder();
        encoder.copyTextureToBuffer({ texture: (stepIdx % 2 === 0 ? texB : texA) }, { buffer: staging, bytesPerRow: bPR }, [width, height, 1]);
        device.queue.submit([encoder.finish()]);
        
        await staging.mapAsync(GPUMapMode.READ);
        const view = new DataView(staging.getMappedRange());
        
        let energy = 0, entropy = 0, vortices = 0;
        let dotSum = 0, magSum = 0;
        let anomalies = [];
        
        for (let y = 0; y < height - 1; y += 4) {
            for (let x = 0; x < width - 1; x += 4) {
                const i00 = y * bPR + x * bPP;
                const i10 = y * bPR + (x + 1) * bPP;
                const i01 = (y + 1) * bPR + x * bPP;
                const i11 = (y + 1) * bPR + (x + 1) * bPP;

                const q00 = { r: view.getFloat32(i00, true), i: view.getFloat32(i00+4, true) };
                const q10 = { r: view.getFloat32(i10, true), i: view.getFloat32(i10+4, true) };
                const q01 = { r: view.getFloat32(i01, true), i: view.getFloat32(i01+4, true) };
                const q11 = { r: view.getFloat32(i11, true), i: view.getFloat32(i11+4, true) };

                const magSq00 = q00.r*q00.r + q00.i*q00.i;
                energy += magSq00;
                if (magSq00 > 0.001) entropy -= magSq00 * Math.log(magSq00);

                dotSum += (q00.r * q10.r + q00.i * q10.i) + (q00.r * q01.r + q00.i * q01.i);
                magSum += magSq00 * 2.0;

                const ph00 = Math.atan2(q00.i, q00.r);
                const ph10 = Math.atan2(q10.i, q10.r);
                const ph01 = Math.atan2(q01.i, q01.r);
                const ph11 = Math.atan2(q11.i, q11.r);

                const dx1 = wrapPhase(ph10 - ph00);
                const dy1 = wrapPhase(ph11 - ph10);
                const dx2 = wrapPhase(ph01 - ph11);
                const dy2 = wrapPhase(ph00 - ph01);
                const charge = Math.round((dx1 + dy1 + dx2 + dy2) / (2 * Math.PI));
                
                if (charge !== 0) {
                    vortices += Math.abs(charge);
                    if (anomalies.length < 50) anomalies.push({ x, y, charge });
                }
            }
        }
        staging.unmap(); staging.destroy();
        const s = (width/4) * (height/4);
        const correlation = dotSum / Math.max(0.0001, magSum);
        
        let regime = "chaotic equilibrium";
        if (correlation > 0.85) regime = "macroscopic order";
        else if (correlation > 0.5) regime = "symmetry breaking";
        else if ((entropy / s) > 0.1 && vortices > 5) regime = "turbulence";

        return { energy: energy / s, entropy: entropy / s, vortices, correlation, regime, anomalies };
    }

    function loop() {
        if (!device) return;
        if (isPlaying) {
            if (interactionBuffer.length > 0 && interactionBuffer[0].step === stepIdx) {
                const ev = interactionBuffer.shift();
                currentParams.mouseX = ev.mouseX; currentParams.mouseY = ev.mouseY;
                currentParams.mouseRadius = ev.mouseRadius;
                currentParams.mouseVelX = ev.mouseVelX; currentParams.mouseVelY = ev.mouseVelY;
            } else if (isRecording && currentParams.mouseRadius > 0) {
                telemetryHistory.push({ type: 'interaction', step: stepIdx, ...currentParams });
            }

            if (currentParams.sweepActive > 0.0) {
                currentParams.mu += 0.0002;
                self.postMessage({ type: 'sweepUpdate', mu: currentParams.mu });
            }

            const inTex = stepIdx % 2 === 0 ? texA : texB;
            const outTex = stepIdx % 2 === 0 ? texB : texA;
            const t = performance.now() / 1000.0, p = currentParams;
            
            device.queue.writeBuffer(macroParamsBuffer, 0, new Float32Array([width, height, 0, 0]));
            const enc = device.createCommandEncoder();
            const mPass = enc.beginComputePass(); mPass.setPipeline(macroPipeline);
            mPass.setBindGroup(0, device.createBindGroup({ layout: macroPipeline.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:macroParamsBuffer}}, {binding:1, resource:inTex.createView()}, {binding:2, resource:macroTex.createView()}] }));
            mPass.dispatchWorkgroups(Math.ceil((width/16)/8), Math.ceil((height/16)/8)); mPass.end();

            device.queue.writeBuffer(paramsBuffer, 0, new Float32Array([p.dt, p.radius, p.phase, p.mu, p.sigma, p.cooling, p.mouseX, p.mouseY, p.mouseRadius, width, height, p.timeDirection, p.topology, p.mouseVelX, p.mouseVelY, p.kernelType, p.latentInterference, t, p.feedback, p.adaptiveConv]));
            const pass = enc.beginComputePass(); pass.setPipeline(computePipeline);
            pass.setBindGroup(0, device.createBindGroup({ layout: computePipeline.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:paramsBuffer}}, {binding:1, resource:inTex.createView()}, {binding:2, resource:macroTex.createView()}, {binding:3, resource:outTex.createView()}] }));
            pass.dispatchWorkgroups(Math.ceil(width/16), Math.ceil(height/16)); pass.end();
            device.queue.submit([enc.finish()]); 
            
            stepIdx++;
            currentParams.mouseVelX *= 0.8; currentParams.mouseVelY *= 0.8;
            if (autoPauseLimit > 0 && stepIdx >= autoPauseLimit) { isPlaying = false; self.postMessage({ type: 'syncPlayState', isPlaying: false }); }
        }
        
        const p = currentParams;
        const time = performance.now() / 1000.0;
        device.queue.writeBuffer(renderParamsBuffer, 0, new Float32Array([p.exposure, p.contour, p.isocline, p.projection, p.colormap, p.renorm, time, 0]));
        const rEnc = device.createCommandEncoder();
        const rPass = rEnc.beginRenderPass({ colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: {r:0, g:0, b:0, a:1}, loadOp: 'clear', storeOp: 'store' }] });
        rPass.setPipeline(renderPipeline);
        rPass.setBindGroup(0, device.createBindGroup({ layout: renderPipeline.getBindGroupLayout(0), entries: [{binding:0, resource:{buffer:renderParamsBuffer}}, {binding:1, resource:(stepIdx % 2 === 0 ? texA : texB).createView()}, {binding:2, resource:macroTex.createView()}] }));
        rPass.draw(3); rPass.end(); device.queue.submit([rEnc.finish()]);

        if (stepIdx % telemetryInterval === 0 && stepIdx !== lastTelemetryStep) {
            lastTelemetryStep = stepIdx;
            executeTelemetryReduction().then(m => {
                if (p.sweepActive > 0.0 && currentRegime === "macroscopic order" && m.regime !== "macroscopic order") {
                    isPlaying = false;
                    currentParams.sweepActive = 0.0;
                    self.postMessage({ type: 'bifurcationDetected', step: stepIdx, mu: currentParams.mu });
                }
                currentRegime = m.regime;

                if (isRecording) telemetryHistory.push({ type: 'telemetry', step: stepIdx, energy: m.energy, entropy: m.entropy, vortices: m.vortices, correlation: m.correlation });
                self.postMessage({ type: 'telemetry', step: stepIdx, energy: m.energy, entropy: m.entropy, vortices: m.vortices, correlation: m.correlation, regime: m.regime, anomalies: m.anomalies, recordedCount: telemetryHistory.length });
            });
        }
        frameId = requestAnimationFrame(loop);
    }

    self.onmessage = async (e) => {
        if (e.data.type === 'init') { self.shaders = e.data.shaders; await initializeWebGPU(e.data.canvas); }
        else if (e.data.type === 'params') { currentParams = { ...currentParams, ...e.data.params }; telemetryInterval = e.data.params.telemetryInterval || 60; autoPauseLimit = e.data.params.autoPause || 0; }
        else if (e.data.type === 'play') { isPlaying = e.data.isPlaying; }
        else if (e.data.type === 'seed') { seedField(e.data.seedType); }
        else if (e.data.type === 'setRecording') { isRecording = e.data.isRecording; if (e.data.clear) telemetryHistory = []; }
        else if (e.data.type === 'loadInteractions') { interactionBuffer = e.data.interactions; }
        else if (e.data.type === 'exportTelemetryCSV') {
            let csv = "type,step,energy,entropy,vortices,correlation,mouseX,mouseY,mouseRadius\\n";
            telemetryHistory.forEach(r => {
                if (r.type === 'telemetry') csv += \`telemetry,\${r.step},\${r.energy},\${r.entropy},\${r.vortices},\${r.correlation},,,\\n\`;
                else csv += \`interaction,\${r.step},,,,,\${r.mouseX},\${r.mouseY},\${r.mouseRadius}\\n\`;
            });
            self.postMessage({ type: 'telemetryDataCSV', csv });
        }
        else if (e.data.type === 'pointer') {
            currentParams.mouseRadius = e.data.mouseRadius;
            if (e.data.isDown && currentParams.mouseX !== -1) { currentParams.mouseVelX = e.data.mouseX - currentParams.mouseX; currentParams.mouseVelY = e.data.mouseY - currentParams.mouseY; }
            currentParams.mouseX = e.data.mouseX; currentParams.mouseY = e.data.mouseY;
        }
    };
    function u32(n) { return n >>> 0; }
`;

// --- React components ---

const PRESETS = {
    solitons: { dt: 0.05, radius: 12, phaseShift: 0.618, mu: 0.28, sigma: 0.045, cooling: 0.01, kernelType: 0, renorm: 1, latentInterference: 0, feedback: 0, adaptiveConv: 0, projection: 0 },
    chaos: { dt: 0.08, radius: 15, phaseShift: -1.2, mu: 0.35, sigma: 0.08, cooling: 0.002, kernelType: 0, renorm: 1, latentInterference: 0.2, feedback: 0.1, adaptiveConv: 0.5, projection: 0 },
    ripple: { dt: 0.03, radius: 8, phaseShift: 2.5, mu: 0.15, sigma: 0.03, cooling: 0.02, kernelType: 1, renorm: 1, latentInterference: 0, feedback: 0.05, adaptiveConv: 0.2, projection: 0 },
    volumetric: { dt: 0.04, radius: 10, phaseShift: 1.618, mu: 0.30, sigma: 0.050, cooling: 0.01, kernelType: 0, renorm: 1, latentInterference: 0, feedback: 0.2, adaptiveConv: 0.8, projection: 2 }
};

export default function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [supported, setSupported] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [params, setParams] = useState({
        dt: 0.05, radius: 12.0, phaseShift: 0.618, mu: 0.28, sigma: 0.045, cooling: 0.01,
        timeDirection: 1, topology: 0, kernelType: 0, latentInterference: 0,
        exposure: 1.2, contour: 5.0, isocline: 0.3, projection: 0, colormap: 0, renorm: 1,
        brush: 30.0, telemetryInterval: 60, autoPause: 0, feedback: 0, adaptiveConv: 0, sweepActive: 0, masterSeed: 12345
    });

    const [telemetry, setTelemetry] = useState({ step: 0, entropy: 0, energy: 0, vortices: 0, correlation: 1.0, regime: "macroscopic order", recordedCount: 0 });
    const [history, setHistory] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [bifurcationData, setBifurcationData] = useState<{step: number, mu: number} | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !navigator.gpu) { setSupported(false); return; }
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        workerRef.current = worker;
        const canvas = canvasRef.current;
        canvas.width = Math.floor(window.innerWidth / 2); canvas.height = Math.floor(window.innerHeight / 2);
        const offscreen = canvas.transferControlToOffscreen();

        worker.onmessage = (e) => {
            if (e.data.type === 'telemetry') {
                setTelemetry({ step: e.data.step, entropy: e.data.entropy, energy: e.data.energy, vortices: e.data.vortices, correlation: e.data.correlation, regime: e.data.regime, recordedCount: e.data.recordedCount });
                setHistory(prev => [...prev.slice(-49), e.data.entropy]);
            } else if (e.data.type === 'syncPlayState') setIsPlaying(e.data.isPlaying);
            else if (e.data.type === 'sweepUpdate') {
                setParams(p => ({ ...p, mu: e.data.mu }));
            } else if (e.data.type === 'bifurcationDetected') {
                setBifurcationData({ step: e.data.step, mu: e.data.mu });
                setIsPlaying(false);
                setParams(p => ({ ...p, sweepActive: 0 }));
            } else if (e.data.type === 'telemetryDataCSV') {
                const url = URL.createObjectURL(new Blob([e.data.csv], { type: 'text/csv' }));
                const a = document.createElement("a"); a.href = url; a.download = `qrf_telemetry_tda_${Date.now()}.csv`;
                a.click(); URL.revokeObjectURL(url);
            }
        };

        worker.postMessage({ type: 'init', canvas: offscreen, shaders: { initWGSL, macroWGSL, computeWGSL, renderWGSL } }, [offscreen]);
        return () => worker.terminate();
    }, []);

    useEffect(() => { workerRef.current?.postMessage({ type: 'params', params }); }, [params]);
    useEffect(() => { workerRef.current?.postMessage({ type: 'play', isPlaying }); }, [isPlaying]);
    useEffect(() => { workerRef.current?.postMessage({ type: 'setRecording', isRecording, clear: false }); }, [isRecording]);

    const handleParamChange = (key: string, value: number) => {
        setParams(p => ({ ...p, [key]: value }));
    };

    const applyPreset = (presetKey: keyof typeof PRESETS) => {
        setParams(p => ({ ...p, ...PRESETS[presetKey] }));
    };

    const handleCanvasPointer = (e: React.PointerEvent, isDown: boolean) => {
        if (!canvasRef.current) return;
        const r = canvasRef.current.getBoundingClientRect();
        workerRef.current?.postMessage({ type: 'pointer', mouseX: (e.clientX - r.left) * (canvasRef.current.width / r.width), mouseY: (e.clientY - r.top) * (canvasRef.current.height / r.height), mouseRadius: isDown ? params.brush : 0, isDown: isDown });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n');
            const interactions = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts[0] === 'interaction') {
                    interactions.push({ step: parseInt(parts[1]), mouseX: parseFloat(parts[5]), mouseY: parseFloat(parts[6]), mouseRadius: parseFloat(parts[7]), mouseVelX: 0, mouseVelY: 0 });
                }
            }
            workerRef.current?.postMessage({ type: 'loadInteractions', interactions });
        };
        reader.readAsText(file);
    };

    if (!supported) return <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-red-400 p-10 text-center uppercase tracking-widest font-mono">WebGPU not supported in this environment.</div>;

    return (
        <div className="flex font-sans antialiased bg-slate-950 text-slate-100 h-screen overflow-hidden">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-8 left-8 z-40 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-full shadow-2xl backdrop-blur-xl transition-all border border-white/10"><Settings2 size={20} /></button>

            <aside className={`w-80 h-screen flex flex-col z-30 absolute left-0 top-0 overflow-y-auto bg-slate-900/85 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 pt-24 border-b border-white/5 space-y-4">
                    <div>
                        <h1 className="text-[11px] font-black text-blue-500 tracking-[0.25em] uppercase mb-1">Cps-hca instrument</h1>
                        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Version: 7.0.0 (Volumetric QRF)</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded space-y-3 font-mono">
                        <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500 uppercase tracking-tighter">Phase state classification:</span><span className="text-blue-400 font-bold tracking-widest">{telemetry.regime}</span></div>
                        <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                            <div className="text-slate-500">Epoch step</div><div className="text-right text-blue-400 font-bold">{telemetry.step}</div>
                            <div className="text-slate-500">Correlation length</div><div className="text-right text-blue-400 font-bold">{telemetry.correlation.toFixed(4)} L</div>
                            <div className="text-slate-500">Struct entropy</div><div className="text-right text-blue-400 font-bold">{telemetry.entropy.toFixed(4)} S</div>
                            <div className="text-slate-500">Topological defects</div><div className="text-right text-blue-400 font-bold">{telemetry.vortices}</div>
                        </div>
                        <div className="pt-2 border-t border-white/5 h-12 flex items-end gap-[1px]">
                            {history.map((v, i) => <div key={i} className="bg-blue-500/40 w-full" style={{ height: `${Math.min(100, v * 10)}%` }} />)}
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-6 py-6 space-y-4">
                    <SidebarSection title="Automated analysis" icon={<Target size={12} className="text-blue-500" />}>
                        {bifurcationData && (
                            <div className="bg-blue-900/30 border border-blue-500/30 p-3 rounded mb-2 font-mono text-[9px] text-blue-200">
                                Bifurcation detected at step {bifurcationData.step}. Critical mean: {bifurcationData.mu.toFixed(4)}.
                            </div>
                        )}
                        <button 
                            onClick={() => {
                                setBifurcationData(null);
                                setParams(p => ({ ...p, sweepActive: p.sweepActive > 0 ? 0 : 1 }));
                                if (params.sweepActive === 0) setIsPlaying(true);
                            }}
                            className={`w-full flex items-center justify-center gap-2 border py-2.5 rounded text-[10px] font-bold uppercase transition-all ${params.sweepActive > 0 ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-white/5'}`}
                        >
                            <Activity size={14} /> {params.sweepActive > 0 ? 'halt bifurcation sweep' : 'initiate bifurcation sweep'}
                        </button>
                    </SidebarSection>

                    <SidebarSection title="Data acquisition" icon={<LineChart size={12} className="text-blue-500" />}>
                        <Slider label="Sampling epoch" value={params.telemetryInterval} min={10} max={300} step={10} onChange={v => handleParamChange('telemetryInterval', v)} format={v => v.toFixed(0)} />
                        <Slider label="Integration limit" value={params.autoPause} min={0} max={10000} step={100} onChange={v => handleParamChange('autoPause', v)} format={v => v === 0 ? 'infinite' : v.toFixed(0)} />
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setIsRecording(!isRecording)} className={`flex-1 flex justify-center items-center gap-1 border py-2.5 rounded text-[10px] font-bold tracking-widest uppercase transition-all ${isRecording ? 'bg-red-600/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-400 border-white/5'}`}>{isRecording ? 'recording' : 'record'}</button>
                            <button onClick={() => workerRef.current?.postMessage({ type: 'setRecording', isRecording: false, clear: true })} className="flex-1 bg-slate-800 text-slate-400 border border-white/5 py-2.5 rounded text-[10px] font-bold uppercase transition-all">clear</button>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => workerRef.current?.postMessage({ type: 'exportTelemetryCSV' })} disabled={telemetry.recordedCount === 0} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 disabled:opacity-50 text-indigo-400 border border-indigo-500/30 py-2.5 rounded text-[10px] font-bold uppercase transition-all"><Download size={14} /> export csv</button>
                            <label className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 cursor-pointer text-slate-400 border border-white/5 py-2.5 rounded text-[10px] font-bold uppercase transition-all">
                                <History size={14} /> replay run
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </SidebarSection>

                    <SidebarSection title="Substrate configuration" icon={<Database size={12} className="text-blue-500" />}>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end"><label className="text-[9px] text-slate-500 font-mono uppercase">Master seed</label><span className="text-[10px] text-blue-400 font-mono">{params.masterSeed}</span></div>
                            <div className="flex gap-2">
                                <input type="number" value={params.masterSeed} onChange={e => setParams(p => ({...p, masterSeed: parseInt(e.target.value) || 0}))} className="flex-1 bg-slate-950 text-slate-300 text-[10px] p-2 rounded border border-white/5 font-mono focus:border-blue-500 outline-none" />
                                <button onClick={() => setParams(p => ({...p, masterSeed: Math.floor(Math.random() * 4294967296)}))} className="bg-slate-800 p-2 rounded border border-white/5"><RotateCcw size={12}/></button>
                            </div>
                        </div>
                        <Select label="Seed type" value={0} onChange={v => workerRef.current?.postMessage({ type: 'seed', seedType: Number(v) })} options={[{ value: 0, label: 'central droplet' }, { value: 1, label: 'uniform noise' }, { value: 2, label: 'resonance ring' }, { value: 3, label: 'gabor cortex' }, { value: 4, label: 'vacuum state' }]} />
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setIsPlaying(!isPlaying)} className="flex-1 flex justify-center items-center gap-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 py-2.5 rounded text-[10px] font-bold uppercase transition-all">{isPlaying ? <Pause size={12}/> : <Play size={12}/>}{isPlaying ? 'pause' : 'play'}</button>
                            <button onClick={() => { applyPreset('volumetric'); workerRef.current?.postMessage({ type: 'seed', seedType: 0 }); }} className="flex-1 bg-slate-800 text-slate-400 border border-white/5 py-2.5 rounded text-[10px] font-bold uppercase transition-all">QRF preset</button>
                        </div>
                    </SidebarSection>

                    <SidebarSection title="Physics engine" icon={<Cpu size={12} className="text-blue-500" />}>
                        <Slider label="Integration step" value={params.dt} min={0.01} max={0.2} step={0.001} onChange={v => handleParamChange('dt', v)} format={v => v.toFixed(3)} />
                        <Slider label="Manifold radius" value={params.radius} min={2.0} max={32.0} step={0.1} onChange={v => handleParamChange('radius', v)} format={v => v.toFixed(1)} />
                        <Slider label="Adaptive convolution" value={params.adaptiveConv} min={0} max={1} step={0.05} onChange={v => handleParamChange('adaptiveConv', v)} format={v => v.toFixed(2)} />
                        <Slider label="Gauge field feedback" value={params.feedback} min={0} max={1} step={0.01} onChange={v => handleParamChange('feedback', v)} format={v => v.toFixed(2)} />
                        <Select label="Kernel" value={params.kernelType} onChange={v => handleParamChange('kernelType', Number(v))} options={[{ value: 0, label: 'isotropic gaussian' }, { value: 1, label: 'difference of gaussians' }]} />
                        <Select label="Topology" value={params.topology} onChange={v => handleParamChange('topology', Number(v))} options={[{ value: 0, label: 'euclidean metric' }, { value: 1, label: 'hyperbolic manifold' }]} />
                    </SidebarSection>

                    <SidebarSection title="Quantum circuit activation" icon={<Activity size={12} className="text-blue-500" />}>
                        <Slider label="Phase shift (ω)" value={params.phaseShift} min={-3.14} max={3.14} step={0.01} onChange={v => handleParamChange('phaseShift', v)} format={v => v.toFixed(3)} />
                        <Slider label="Resonance mean" value={params.mu} min={0.05} max={0.5} step={0.01} onChange={v => handleParamChange('mu', v)} format={v => v.toFixed(3)} />
                        <Slider label="Gate variance" value={params.sigma} min={0.01} max={0.2} step={0.001} onChange={v => handleParamChange('sigma', v)} format={v => v.toFixed(3)} />
                        <Slider label="Decoherence threshold" value={params.cooling} min={0.0} max={0.1} step={0.001} onChange={v => handleParamChange('cooling', v)} format={v => v.toFixed(3)} />
                    </SidebarSection>

                    <SidebarSection title="Observer metrics" icon={<Eye size={12} className="text-blue-500" />}>
                        <Select label="Projection" value={params.projection} onChange={v => handleParamChange('projection', Number(v))} options={[{ value: 0, label: 'euclidean flat' }, { value: 1, label: 'poincaré disk' }, { value: 2, label: 'volumetric ray marching' }]} />
                        <Select label="Colormap" value={params.colormap} onChange={v => handleParamChange('colormap', Number(v))} options={[{ value: 0, label: 'standard domain' }, { value: 1, label: 'thermodynamic entropy' }, { value: 2, label: 'phase topology' }, { value: 3, label: 'topological curvature' }]} />
                        <Slider label="Exposure" value={params.exposure} min={0.1} max={3.0} step={0.1} onChange={v => handleParamChange('exposure', v)} format={v => v.toFixed(1)} />
                        <Slider label="Renormalisation" value={params.renorm} min={1} max={8} step={1} onChange={v => handleParamChange('renorm', v)} format={v => v.toFixed(1) + 'x'} />
                    </SidebarSection>

                    <div className="pt-6 border-t border-white/5"><Slider label="Brush radius" value={params.brush} min={5.0} max={150.0} step={1.0} onChange={v => handleParamChange('brush', v)} format={v => v.toFixed(1)} bold /></div>
                </div>
                <div className="p-8 pb-12 bg-black/20 border-t border-white/5"><p className="text-[9px] text-slate-500 leading-relaxed font-mono uppercase tracking-[0.1em]">Volumetric topological ray marching and exact tensor network contractions active.</p></div>
            </aside>

            <main className="flex-1 relative cursor-crosshair">
                <canvas ref={canvasRef} className="block w-full h-full" style={{ imageRendering: 'pixelated' }} onPointerDown={e => handleCanvasPointer(e, true)} onPointerMove={e => handleCanvasPointer(e, e.buttons > 0)} onPointerUp={e => handleCanvasPointer(e, false)} />
                <div className="absolute bottom-8 right-8 z-10 pointer-events-none text-[8px] font-mono text-slate-600 uppercase tracking-[0.3em]" style={{ writingMode: 'vertical-rl' }}>Continuous phase space manifold [HCA-7.0.0]</div>
            </main>
        </div>
    );
}

function SidebarSection({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <details open className="group">
            <summary className="flex items-center justify-between py-2 cursor-pointer group-hover:text-slate-200 list-none"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">{icon}{title}</h3><span className="text-slate-600 group-open:rotate-180 transition-transform text-[8px]">▼</span></summary>
            <div className="space-y-4 pt-4 pb-2">{children}</div>
        </details>
    );
}

function Slider({ label, value, min, max, step, onChange, format, bold = false }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, format: (v: number) => string, bold?: boolean }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end"><label className={`text-[9px] text-slate-500 font-mono uppercase ${bold ? 'font-bold tracking-widest' : ''}`}>{label}</label><span className="text-[10px] text-blue-400 font-mono">{format(value)}</span></div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-0.5 bg-slate-800 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full" />
        </div>
    );
}

function Select({ label, value, options, onChange }: { label?: string, value: string | number, options: {value: string|number, label: string}[], onChange: (v: string) => void }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-950 text-slate-300 text-[10px] p-2.5 rounded border border-white/5 font-mono focus:border-blue-500 outline-none transition-colors" aria-label={label}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}