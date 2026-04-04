```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Settings2, Activity, Eye, Cpu, Database, LineChart, History, Target, Share2 } from 'lucide-react';

// --- Wgsl shader definitions ---

const initWGSL = `
    const PI: f32 = 3.14159265359;
    const TWO_PI: f32 = 6.28318530718;
    const HASH_PRIME_1: u32 = 747796405u;
    const HASH_PRIME_2: u32 = 2891336453u;
    const HASH_PRIME_3: u32 = 277803737u;

    struct InitParams {
        seed: u32,
        width: f32,
        height: f32,
        seedType: f32,
    };
    @group(0) @binding(0) var<uniform> params: InitParams;
    @group(0) @binding(1) var stateOut: texture_storage_2d<rgba32float, write>;

    fn pcg32_hash(seed: u32) -> u32 {
        var state = seed * HASH_PRIME_1 + HASH_PRIME_2;
        var word = ((state >> ((state >> 28u) + 4u)) ^ state) * HASH_PRIME_3;
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
        let x = f32(coord.x) + 0.5;
        let y = f32(coord.y) + 0.5;
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
            ph = (dist / initRadius) * TWO_PI + (random_float(&local_seed) - 0.5);
            is_active = true;
        } else if (st == 1) {
            mag = random_float(&local_seed) * 0.8;
            ph = random_float(&local_seed) * TWO_PI;
            is_active = true;
        } else if (st == 2 && abs(dist - initRadius * 1.5) < 15.0) {
            mag = random_float(&local_seed) * 0.5 + 0.3;
            ph = atan2(dy, dx) * 6.0 + (random_float(&local_seed) - 0.5);
            is_active = true;
        } else if (st == 3) {
            let theta = PI / 4.0; 
            let lambda = 12.0;
            let gamma = 0.6;
            let sigmaG = initRadius * 0.5;
            let xP = dx * cos(theta) + dy * sin(theta);
            let yP = -dx * sin(theta) + dy * cos(theta);
            let envelope = exp(-(xP*xP + gamma*gamma * yP*yP) / (2.0 * sigmaG*sigmaG));
            let carrier = cos(TWO_PI * xP / lambda);
            mag = envelope * abs(carrier) * 0.9;
            if (carrier > 0.0) { ph = theta; } else { ph = theta + PI; }
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
    const MACRO_BLOCK_SIZE: i32 = 16;
    const NORM_FACTOR: f32 = 256.0;

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
        let macro_dim = vec2<i32>(
            (i32(params.width) + MACRO_BLOCK_SIZE - 1) / MACRO_BLOCK_SIZE, 
            (i32(params.height) + MACRO_BLOCK_SIZE - 1) / MACRO_BLOCK_SIZE
        );
        if (macro_coord.x >= macro_dim.x || macro_coord.y >= macro_dim.y) { return; }

        var sum_z = vec2<f32>(0.0);
        let base_x = macro_coord.x * MACRO_BLOCK_SIZE;
        let base_y = macro_coord.y * MACRO_BLOCK_SIZE;

        for (var dy = 0; dy < MACRO_BLOCK_SIZE; dy++) {
            for (var dx = 0; dx < MACRO_BLOCK_SIZE; dx++) {
                let coord = vec2<i32>(base_x + dx, base_y + dy);
                let clamped_coord = clamp(coord, vec2<i32>(0), vec2<i32>(i32(params.width) - 1, i32(params.height) - 1));
                let z = textureLoad(stateIn, clamped_coord, 0).xy;
                sum_z += z;
            }
        }
        
        let born_intensity = dot(sum_z, sum_z) / NORM_FACTOR;
        
        textureStore(macroOut, macro_coord, vec4<f32>(born_intensity, sum_z.x, sum_z.y, 1.0));
    }
`;

const computeWGSL = `
    const EPSILON: f32 = 1e-6;
    const HYPERBOLIC_LIMIT: f32 = 0.98;

    struct Params {
        dt: f32, radius: f32, phaseShift: f32, mu: f32, sigma: f32, cooling: f32, mouseX: f32, mouseY: f32, mouseRadius: f32, resolutionX: f32, resolutionY: f32, timeDirection: f32, topology: f32, mouseVelX: f32, mouseVelY: f32, kernelType: f32, latentInterference: f32, time: f32, feedbackStrength: f32, adaptiveConv: f32,
    };
    @group(0) @binding(0) var<uniform> params: Params;
    @group(0) @binding(1) var stateIn: texture_2d<f32>;
    @group(0) @binding(2) var macroIn: texture_2d<f32>;
    @group(0) @binding(3) var stateOut: texture_storage_2d<rgba32float, write>;

    fn safe_len(v: vec2<f32>) -> vec2<f32> {
        let l = length(v);
        if (l > 0.99) { return (v / l) * 0.99; }
        return v;
    }

    fn moebius_add(u_in: vec2<f32>, v_in: vec2<f32>) -> vec2<f32> {
        let u = safe_len(u_in);
        let v = safe_len(v_in);
        let u_dot_v = dot(u, v);
        let u_sq = dot(u, u);
        let v_sq = dot(v, v);
        let num = (1.0 + 2.0 * u_dot_v + v_sq) * u + (1.0 - u_sq) * v;
        let den = 1.0 + 2.0 * u_dot_v + u_sq * v_sq;
        return safe_len(num / max(EPSILON, den));
    }

    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
        let coord = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
        let dimensions = vec2<i32>(i32(params.resolutionX), i32(params.resolutionY));
        if (coord.x >= dimensions.x || coord.y >= dimensions.y) { return; }

        let aspect = params.resolutionX / params.resolutionY;
        var uv_center = (vec2<f32>(f32(coord.x) + 0.5, f32(coord.y) + 0.5) / vec2<f32>(params.resolutionX, params.resolutionY)) * 2.0 - 1.0;
        uv_center.x *= aspect;

        if (params.topology > 0.5) {
            if (length(uv_center) >= HYPERBOLIC_LIMIT) {
                textureStore(stateOut, coord, vec4<f32>(0.0, 0.0, 0.0, 0.0));
                return;
            }
        }

        let state_val = textureLoad(stateIn, coord, 0);
        var q_old = state_val.xy;
        let p_old = state_val.zw;
        
        let macro_coord = clamp(vec2<i32>(coord.x / 16, coord.y / 16), vec2<i32>(0), vec2<i32>(dimensions.x / 16, dimensions.y / 16));
        let macro_val = textureLoad(macroIn, macro_coord, 0);
        let born_intensity = macro_val.x;
        
        var effective_radius = params.radius;
        if (params.adaptiveConv > 0.0) {
            let local_entropy = max(0.0, 1.0 - born_intensity);
            effective_radius = max(2.0, params.radius * (1.0 - (local_entropy * params.adaptiveConv)));
        }

        let is_hyperbolic = params.topology > 0.5;
        var local_effective_radius = effective_radius;

        if (is_hyperbolic) {
            let r_euclidean = min(length(uv_center), HYPERBOLIC_LIMIT);
            let metric_factor = max(0.05, 1.0 - r_euclidean * r_euclidean);
            local_effective_radius = effective_radius * metric_factor;
        }
        
        var z_sum = vec2<f32>(0.0);
        var z_sum_inner = vec2<f32>(0.0);
        var weight_sum = 0.0;
        var weight_sum_inner = 0.0;
        
        let r_pixel = i32(local_effective_radius);
        let step_val = max(1, r_pixel / 8); 

        for (var y = -r_pixel; y <= r_pixel; y += step_val) {
            for (var x = -r_pixel; x <= r_pixel; x += step_val) {
                let offset = vec2<i32>(x, y);
                var neighbor_coord = coord + offset;
                var dist = 0.0;
                var is_vacuum = false;
                
                if (is_hyperbolic) {
                    if (neighbor_coord.x < 0 || neighbor_coord.x >= dimensions.x || neighbor_coord.y < 0 || neighbor_coord.y >= dimensions.y) {
                        is_vacuum = true;
                    }
                    neighbor_coord = clamp(neighbor_coord, vec2<i32>(0), dimensions - vec2<i32>(1));
                    
                    var u = uv_center;
                    if (length(u) > HYPERBOLIC_LIMIT) { u = normalize(u) * HYPERBOLIC_LIMIT; }
                    
                    var uv_neighbor = (vec2<f32>(f32(neighbor_coord.x) + 0.5, f32(neighbor_coord.y) + 0.5) / vec2<f32>(params.resolutionX, params.resolutionY)) * 2.0 - 1.0;
                    uv_neighbor.x *= aspect;
                    var v = uv_neighbor;

                    if (length(v) > HYPERBOLIC_LIMIT) {
                        v = normalize(v) * HYPERBOLIC_LIMIT;
                        is_vacuum = true;
                    }
                    let num = 2.0 * dot(u - v, u - v);
                    let den = max(EPSILON, (1.0 - dot(u, u)) * (1.0 - dot(v, v)));
                    let arg = max(1.0, 1.0 + num / den);
                    let hyp_dist = log(arg + sqrt(arg * arg - 1.0));
                    dist = hyp_dist * (params.resolutionX * 0.1); 
                } else {
                    neighbor_coord = vec2<i32>((neighbor_coord.x + dimensions.x) % dimensions.x, (neighbor_coord.y + dimensions.y) % dimensions.y);
                    dist = length(vec2<f32>(f32(x), f32(y)));
                }

                if (dist <= local_effective_radius) {
                    var neighbor_q = textureLoad(stateIn, neighbor_coord, 0).xy;
                    if (is_vacuum) { neighbor_q = vec2<f32>(0.0); }
                    let weight = exp(-(dist * dist) / (local_effective_radius * local_effective_radius * 0.5));
                    
                    if (is_hyperbolic) {
                        z_sum = moebius_add(z_sum, neighbor_q * weight * 0.125);
                    } else {
                        z_sum += neighbor_q * weight;
                    }
                    
                    weight_sum += weight;
                    
                    if (params.kernelType > 0.5) {
                        let inner_r = local_effective_radius * 0.33;
                        let inner_weight = exp(-(dist * dist) / (inner_r * inner_r * 0.5));
                        if (is_hyperbolic) {
                            z_sum_inner = moebius_add(z_sum_inner, neighbor_q * inner_weight * 0.125);
                        } else {
                            z_sum_inner += neighbor_q * inner_weight;
                        }
                        weight_sum_inner += inner_weight;
                    }
                }
            }
        }
        
        if (!is_hyperbolic) {
            z_sum = z_sum / max(EPSILON, weight_sum);
            if (params.kernelType > 0.5) {
                z_sum = (z_sum_inner / max(EPSILON, weight_sum_inner)) - z_sum;
            }
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
        
        var p_new = p_old * (1.0 - params.cooling) + force * current_dt;
        var q_new = vec2<f32>(0.0);
        
        if (is_hyperbolic) {
            var p_step = p_new * current_dt;
            q_new = moebius_add(q_old, p_step);
        } else {
            q_new = safe_len(q_old + p_new * current_dt);
        }

        var coord_r = vec2<i32>(coord.x + 1, coord.y);
        var coord_l = vec2<i32>(coord.x - 1, coord.y);
        var coord_u = vec2<i32>(coord.x, coord.y - 1);
        var coord_d = vec2<i32>(coord.x, coord.y + 1);

        var q_r = vec2<f32>(0.0);
        var q_l = vec2<f32>(0.0);
        var q_u = vec2<f32>(0.0);
        var q_d = vec2<f32>(0.0);

        if (is_hyperbolic) {
            if (coord_r.x < dimensions.x) { q_r = textureLoad(stateIn, coord_r, 0).xy; } else { q_r = vec2<f32>(-1.0, 0.0); }
            if (coord_l.x >= 0) { q_l = textureLoad(stateIn, coord_l, 0).xy; } else { q_l = vec2<f32>(-1.0, 0.0); }
            if (coord_u.y >= 0) { q_u = textureLoad(stateIn, coord_u, 0).xy; } else { q_u = vec2<f32>(-1.0, 0.0); }
            if (coord_d.y < dimensions.y) { q_d = textureLoad(stateIn, coord_d, 0).xy; } else { q_d = vec2<f32>(-1.0, 0.0); }
        } else {
            coord_r.x = coord_r.x % dimensions.x;
            coord_l.x = (coord_l.x + dimensions.x) % dimensions.x;
            coord_u.y = (coord_u.y + dimensions.y) % dimensions.y;
            coord_d.y = coord_d.y % dimensions.y;
            
            q_r = textureLoad(stateIn, coord_r, 0).xy;
            q_l = textureLoad(stateIn, coord_l, 0).xy;
            q_u = textureLoad(stateIn, coord_u, 0).xy;
            q_d = textureLoad(stateIn, coord_d, 0).xy;
        }
        
        let z_parity_xy = q_r.x * q_l.x * q_u.x * q_d.x;
        let z_parity_z = sign(macro_val.y) * sign(q_old.x); 
        let z_parity_3d = z_parity_xy * z_parity_z;

        if (z_parity_3d < -0.01) {
            q_new = vec2<f32>(q_new.y, -q_new.x);
        }

        let f_coord = vec2<f32>(f32(coord.x), f32(coord.y));
        if (params.latentInterference > 0.0) {
            let latent_phase = sin(f_coord.x * 0.02 + params.time) * cos(f_coord.y * 0.02 - params.time * 0.5);
            let interference = vec2<f32>(cos(latent_phase), sin(latent_phase)) * params.latentInterference * params.dt;
            if (is_hyperbolic) {
                q_new = moebius_add(q_new, interference);
            } else {
                q_new = safe_len(q_new + interference);
            }
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

const telemetryWGSL = `
    const PI: f32 = 3.14159265359;
    const TWO_PI: f32 = 6.28318530718;
    const BLOCK_SIZE: i32 = 4;
    const HYPERBOLIC_LIMIT: f32 = 0.98;

    struct TelemetryData {
        energy: f32,
        entropy: f32,
        correlation_dot: f32,
        correlation_mag: f32,
        vortices: f32,
        pad1: f32, pad2: f32, pad3: f32,
    };

    struct Dimensions { width: f32, height: f32, topology: f32, pad: f32 };

    @group(0) @binding(0) var stateIn: texture_2d<f32>;
    @group(0) @binding(1) var<storage, read_write> outData: array<TelemetryData>;
    @group(0) @binding(2) var<uniform> dimensions: Dimensions;

    fn wrap_phase(ph: f32) -> f32 {
        var res = ph % TWO_PI;
        if (res > PI) { res -= TWO_PI; }
        else if (res < -PI) { res += TWO_PI; }
        return res;
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let dim = vec2<i32>(i32(dimensions.width), i32(dimensions.height));
        let out_width = (dim.x + BLOCK_SIZE - 1) / BLOCK_SIZE;
        let out_height = (dim.y + BLOCK_SIZE - 1) / BLOCK_SIZE;
        
        if (i32(id.x) >= out_width || i32(id.y) >= out_height) { return; }

        var local_energy: f32 = 0.0;
        var local_entropy: f32 = 0.0;
        var local_dot: f32 = 0.0;
        var local_mag: f32 = 0.0;
        var local_vortices: f32 = 0.0;

        let base_x = i32(id.x) * BLOCK_SIZE;
        let base_y = i32(id.y) * BLOCK_SIZE;

        for (var dy = 0; dy < BLOCK_SIZE; dy++) {
            for (var dx = 0; dx < BLOCK_SIZE; dx++) {
                let coord = clamp(vec2<i32>(base_x + dx, base_y + dy), vec2<i32>(0), dim - vec2<i32>(1));
                
                var volume_element = 1.0;
                if (dimensions.topology > 0.5) {
                    let aspect = dimensions.width / dimensions.height;
                    var uv = (vec2<f32>(f32(coord.x) + 0.5, f32(coord.y) + 0.5) / vec2<f32>(dimensions.width, dimensions.height)) * 2.0 - 1.0;
                    uv.x *= aspect;

                    let r_len = length(uv);
                    if (r_len >= HYPERBOLIC_LIMIT) {
                        volume_element = 0.0;
                    } else {
                        let r2 = dot(uv, uv);
                        volume_element = min(4.0 / pow(max(0.01, 1.0 - r2), 2.0), 50.0);
                    }
                }

                let q00 = textureLoad(stateIn, coord, 0).xy;
                let q10 = textureLoad(stateIn, clamp(vec2<i32>(coord.x + 1, coord.y), vec2<i32>(0), dim - vec2<i32>(1)), 0).xy;
                let q01 = textureLoad(stateIn, clamp(vec2<i32>(coord.x, coord.y + 1), vec2<i32>(0), dim - vec2<i32>(1)), 0).xy;
                let q11 = textureLoad(stateIn, clamp(vec2<i32>(coord.x + 1, coord.y + 1), vec2<i32>(0), dim - vec2<i32>(1)), 0).xy;

                let magSq00 = dot(q00, q00);
                local_energy += magSq00 * volume_element;
                
                if (magSq00 > 0.0001) {
                    let safe_mag = min(magSq00, 0.9999);
                    local_entropy -= (safe_mag * log(safe_mag)) * volume_element;
                }

                local_dot += (q00.x * q10.x + q00.y * q10.y) + (q00.x * q01.x + q00.y * q01.y);
                local_mag += magSq00 * 2.0 * volume_element;

                let ph00 = atan2(q00.y, q00.x);
                let ph10 = atan2(q10.y, q10.x);
                let ph01 = atan2(q01.y, q01.x);
                let ph11 = atan2(q11.y, q11.x);

                let dx1 = wrap_phase(ph10 - ph00);
                let dy1 = wrap_phase(ph11 - ph10);
                let dx2 = wrap_phase(ph01 - ph11);
                let dy2 = wrap_phase(ph00 - ph01);
                let charge = round((dx1 + dy1 + dx2 + dy2) / TWO_PI);

                if (charge != 0.0) {
                    local_vortices += abs(charge);
                }
            }
        }

        let out_idx = i32(id.y) * out_width + i32(id.x);
        outData[out_idx].energy = local_energy;
        outData[out_idx].entropy = local_entropy;
        outData[out_idx].correlation_dot = local_dot;
        outData[out_idx].correlation_mag = local_mag;
        outData[out_idx].vortices = local_vortices;
    }
`;

const renderWGSL = `
    const PI: f32 = 3.14159265359;
    
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
                let macro_coord = vec2<i32>(clamp(s_uv * macro_dim, vec2<f32>(0.0), macro_dim - vec2<f32>(1.0)));
                let born_intensity = textureLoad(macroTex, macro_coord, 0).x;
                
                if (born_intensity < 0.0001) {
                    t_dist += 0.05;
                    continue;
                }
                
                let tex_coord = vec2<i32>(clamp(s_uv * state_dim, vec2<f32>(0.0), state_dim - vec2<f32>(1.0)));
                let state = textureLoad(stateTex, tex_coord, 0);
                let q = state.xy;
                
                let mag = length(q);
                let local_density = exp(-pow(p_vol.z * 4.0, 2.0)) * mag;
                
                if (local_density > 0.05) {
                    let ph = atan2(q.y, q.x);
                    let hue = (ph / (2.0 * PI)) + 0.5;
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
            let aspect = f32(textureDimensions(stateTex).x) / f32(textureDimensions(stateTex).y);
            var c = uv * 2.0 - 1.0;
            c.x *= aspect;
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
        let hue = (ph / (2.0 * PI)) + 0.5;
        let val = 1.0 - exp(-mag * rParams.exposure);
        var rgb = vec3<f32>(0.0);

        if (rParams.colorMode < 0.5) {
            let sat = 0.5 + 0.5 * sin(mag * rParams.contourFreq * PI);
            rgb = hsv2rgb(vec3<f32>(hue, sat, val));
            let line = smoothstep(0.0, 0.1, fract(ph * 4.0/PI)) * smoothstep(1.0, 0.9, fract(ph * 4.0/PI));
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
    let adapterInfoCache = null;
    let context = null;
    let format = null;
    let initPipeline = null, macroPipeline = null, computePipeline = null, renderPipeline = null, telemetryPipeline = null;
    let paramsBuffer = null, initParamsBuffer = null, macroParamsBuffer = null, renderParamsBuffer = null, telemetryDimBuffer = null;
    let texA = null, texB = null, macroTex = null, telemetryStorageBuffer = null;
    let width = 0, height = 0, stepIdx = 0, frameId = 0, isPlaying = true;
    
    let isRecording = false, telemetryHistory = [], interactionBuffer = [], telemetryInterval = 60, autoPauseLimit = 0, lastTelemetryStep = -1;
    let currentRegime = "chaotic equilibrium";
    let telemetryReductionRunning = false;

    let currentParams = {
        dt: 0.05, radius: 12.0, phase: 0.618, mu: 0.28, sigma: 0.045, cooling: 0.01,
        mouseX: -1, mouseY: -1, mouseRadius: 0, timeDirection: 1, topology: 0,
        mouseVelX: 0, mouseVelY: 0, kernelType: 0, latentInterference: 0,
        exposure: 1.2, contour: 5.0, isocline: 0.3, projection: 0, colormap: 0, renorm: 1,
        feedback: 0, adaptiveConv: 0.0, sweepActive: 0.0, masterSeed: 12345
    };

    function computeFFT1D(complexArray) {
        const N = complexArray.length;
        if (N <= 1) return complexArray;
        const half = N / 2;
        const even = new Array(half);
        const odd = new Array(half);
        for (let i = 0; i < half; i++) {
            even[i] = complexArray[i * 2];
            odd[i] = complexArray[i * 2 + 1];
        }
        const fftEven = computeFFT1D(even);
        const fftOdd = computeFFT1D(odd);
        const out = new Array(N);
        for (let k = 0; k < half; k++) {
            const theta = -2.0 * Math.PI * k / N;
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);
            const oddK = fftOdd[k];
            const tr = cosT * oddK.r - sinT * oddK.i;
            const ti = cosT * oddK.i + sinT * oddK.r;
            out[k] = { r: fftEven[k].r + tr, i: fftEven[k].i + ti };
            out[k + half] = { r: fftEven[k].r - tr, i: fftEven[k].i - ti };
        }
        return out;
    }

    function compute2DRadialPSD(flatComplexData, size) {
        let rowFFT = new Array(size * size);
        for (let y = 0; y < size; y++) {
            const row = flatComplexData.slice(y * size, (y + 1) * size);
            const transformed = computeFFT1D(row);
            for (let x = 0; x < size; x++) rowFFT[y * size + x] = transformed[x];
        }
        
        let colFFT = new Array(size * size);
        for (let x = 0; x < size; x++) {
            const col = new Array(size);
            for (let y = 0; y < size; y++) col[y] = rowFFT[y * size + x];
            const transformed = computeFFT1D(col);
            for (let y = 0; y < size; y++) colFFT[y * size + x] = transformed[y];
        }

        const center = size / 2;
        const maxRadius = Math.floor(Math.sqrt(center * center * 2));
        const radialBins = new Float32Array(maxRadius + 1);
        const radialCounts = new Int32Array(maxRadius + 1);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const shiftedX = x < center ? x + center : x - center;
                const shiftedY = y < center ? y + center : y - center;
                const dx = shiftedX - center;
                const dy = shiftedY - center;
                const r = Math.round(Math.sqrt(dx * dx + dy * dy));
                
                if (r <= center) {
                    const val = colFFT[y * size + x];
                    const mag = Math.sqrt(val.r * val.r + val.i * val.i) / (size * size);
                    radialBins[r] += mag;
                    radialCounts[r] += 1;
                }
            }
        }

        const psd = [];
        for (let i = 0; i < center; i++) {
            psd.push(radialCounts[i] > 0 ? radialBins[i] / radialCounts[i] : 0.0);
        }
        return psd;
    }

    async function initializeWebGPU(canvas) {
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
        if (!adapter) { self.postMessage({ type: 'error', message: "No adapter found." }); return; }
        
        if (adapter.requestAdapterInfo) {
            adapterInfoCache = await adapter.requestAdapterInfo();
        } else if (adapter.info) {
            adapterInfoCache = adapter.info;
        }
        
        device = await adapter.requestDevice();
        
        device.addEventListener('uncapturederror', (event) => {
            console.error('Uncaptured WebGPU error:', event.error.message);
        });

        context = canvas.getContext('webgpu');
        format = navigator.gpu.getPreferredCanvasFormat();
        width = canvas.width; height = canvas.height;
        context.configure({ device, format, alphaMode: 'premultiplied' });

        paramsBuffer = device.createBuffer({ size: 20 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        initParamsBuffer = device.createBuffer({ size: 4 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        macroParamsBuffer = device.createBuffer({ size: 4 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        renderParamsBuffer = device.createBuffer({ size: 8 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        telemetryDimBuffer = device.createBuffer({ size: 4 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        device.queue.writeBuffer(telemetryDimBuffer, 0, new Float32Array([width, height, 0, 0]));

        const texCfg = { size: [width, height, 1], format: 'rgba32float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC };
        texA = device.createTexture(texCfg); texB = device.createTexture(texCfg);
        
        const macroDimX = Math.ceil(width / 16);
        const macroDimY = Math.ceil(height / 16);
        macroTex = device.createTexture({ size: [macroDimX, macroDimY, 1], format: 'rgba32float', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING });

        const telemetryBlocksX = Math.ceil(width / 4);
        const telemetryBlocksY = Math.ceil(height / 4);
        const telemetryStructSize = 8 * 4;
        telemetryStorageBuffer = device.createBuffer({ size: telemetryBlocksX * telemetryBlocksY * telemetryStructSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });

        try {
            device.pushErrorScope('validation');
            
            initPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: self.shaders.initWGSL }), entryPoint: 'main' } });
            macroPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: self.shaders.macroWGSL }), entryPoint: 'main' } });
            computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: self.shaders.computeWGSL }), entryPoint: 'main' } });
            telemetryPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: self.shaders.telemetryWGSL }), entryPoint: 'main' }});
            renderPipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module: device.createShaderModule({ code: self.shaders.renderWGSL }), entryPoint: 'vert_main' }, fragment: { module: device.createShaderModule({ code: self.shaders.renderWGSL }), entryPoint: 'frag_main', targets: [{ format }] }, primitive: { topology: 'triangle-list' } });

            const error = await device.popErrorScope();
            if (error) {
                console.error("Pipeline compilation validation error:", error.message);
                return;
            }
        } catch(err) {
            console.error("Critical error during pipeline construction", err);
            return;
        }

        seedField(0);
        loop();
    }

    function cleanup() {
        if (!device) return;
        cancelAnimationFrame(frameId);
        
        if (texA) texA.destroy();
        if (texB) texB.destroy();
        if (macroTex) macroTex.destroy();
        if (paramsBuffer) paramsBuffer.destroy();
        if (initParamsBuffer) initParamsBuffer.destroy();
        if (macroParamsBuffer) macroParamsBuffer.destroy();
        if (renderParamsBuffer) renderParamsBuffer.destroy();
        if (telemetryDimBuffer) telemetryDimBuffer.destroy();
        if (telemetryStorageBuffer) telemetryStorageBuffer.destroy();
        
        device.destroy();
        device = null;
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

    async function exportTensorBinary() {
        const bpr = Math.ceil((width * 16) / 256) * 256;
        const staging = device.createBuffer({ size: bpr * height, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
        const encoder = device.createCommandEncoder();
        encoder.copyTextureToBuffer({ texture: stepIdx % 2 === 0 ? texA : texB }, { buffer: staging, bytesPerRow: bpr }, [width, height, 1]);
        device.queue.submit([encoder.finish()]);
        
        await staging.mapAsync(GPUMapMode.READ);
        const data = new Float32Array(staging.getMappedRange());
        const cleanedData = new Float32Array(width * height * 4);
        for(let y = 0; y < height; y++) {
            const srcOff = (y * bpr) / 4;
            const dstOff = y * width * 4;
            cleanedData.set(data.subarray(srcOff, srcOff + width * 4), dstOff);
        }
        
        const wgslSource = self.shaders.initWGSL + self.shaders.macroWGSL + self.shaders.computeWGSL + self.shaders.telemetryWGSL + self.shaders.renderWGSL;
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(wgslSource));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        let hwInfo = adapterInfoCache ? \`\${adapterInfoCache.vendor} \${adapterInfoCache.architecture}\` : "Unknown GPU architecture";

        const metadata = JSON.stringify({
            version: "7.1.4-verifiable",
            timestamp: new Date().toISOString(),
            dimensions: [width, height],
            hashSHA256: hashHex,
            hardware: hwInfo,
            parameters: currentParams
        });
        
        const metaBytes = new TextEncoder().encode(metadata);
        const metaLength = new Uint32Array([metaBytes.length]);
        
        const blob = new Blob([metaLength, metaBytes, cleanedData], { type: 'application/octet-stream' });
        staging.unmap(); staging.destroy();
        
        self.postMessage({ type: 'tensorExported', blob, hashHex });
    }

    async function executeParallelTelemetry() {
        if (telemetryReductionRunning) return;
        telemetryReductionRunning = true;

        const outBlocksX = Math.ceil(width / 4);
        const outBlocksY = Math.ceil(height / 4);
        const totalBlocks = outBlocksX * outBlocksY;
        const bufferSize = totalBlocks * 8 * 4;

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(telemetryPipeline);
        
        const inTex = stepIdx % 2 === 0 ? texB : texA;
        device.queue.writeBuffer(telemetryDimBuffer, 0, new Float32Array([width, height, currentParams.topology, 0]));
        
        const bindGroup = device.createBindGroup({
            layout: telemetryPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: inTex.createView() },
                { binding: 1, resource: { buffer: telemetryStorageBuffer } },
                { binding: 2, resource: { buffer: telemetryDimBuffer } }
            ]
        });
        
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(outBlocksX / 8), Math.ceil(outBlocksY / 8));
        pass.end();

        const stagingBuffer = device.createBuffer({ size: bufferSize, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
        encoder.copyBufferToBuffer(telemetryStorageBuffer, 0, stagingBuffer, 0, bufferSize);

        let fftSize = 1;
        while (fftSize * 2 <= Math.min(width, height, 128)) fftSize *= 2;
        if (fftSize < 4) fftSize = 4;

        const fftBpr = Math.ceil((fftSize * 16) / 256) * 256;
        const fftStaging = device.createBuffer({ size: fftBpr * fftSize, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });

        const originX = Math.max(0, Math.floor(width / 2) - fftSize / 2);
        const originY = Math.max(0, Math.floor(height / 2) - fftSize / 2);

        encoder.copyTextureToBuffer(
            { texture: inTex, origin: [originX, originY, 0] },
            { buffer: fftStaging, bytesPerRow: fftBpr, rowsPerImage: fftSize },
            [fftSize, fftSize, 1]
        );

        device.queue.submit([encoder.finish()]);

        const [mapStaging, mapFft] = await Promise.all([
            stagingBuffer.mapAsync(GPUMapMode.READ),
            fftStaging.mapAsync(GPUMapMode.READ)
        ]);

        const arrayBuffer = stagingBuffer.getMappedRange();
        const view = new Float32Array(arrayBuffer);

        let sumEnergy = 0;
        let sumEntropy = 0;
        let sumCorrelationDot = 0;
        let sumCorrelationMag = 0;
        let sumVortices = 0;

        for (let i = 0; i < totalBlocks; i++) {
            const offset = i * 8;
            sumEnergy += view[offset];
            sumEntropy += view[offset + 1];
            sumCorrelationDot += view[offset + 2];
            sumCorrelationMag += view[offset + 3];
            sumVortices += view[offset + 4];
        }

        const fftView = new Float32Array(fftStaging.getMappedRange());
        const complexData = new Array(fftSize * fftSize);
        for(let y = 0; y < fftSize; y++) {
            const rowOffset = (y * fftBpr) / 4;
            for(let x = 0; x < fftSize; x++) {
                complexData[y * fftSize + x] = { r: fftView[rowOffset + x*4], i: fftView[rowOffset + x*4 + 1] };
            }
        }
        
        stagingBuffer.unmap();
        stagingBuffer.destroy();
        fftStaging.unmap();
        fftStaging.destroy();

        const spectralPSD = compute2DRadialPSD(complexData, fftSize);

        telemetryReductionRunning = false;

        const totalPixels = width * height;
        const correlation = sumCorrelationDot / Math.max(0.0001, sumCorrelationMag);
        
        let regime = "chaotic equilibrium";
        if (correlation > 0.85) regime = "macroscopic order";
        else if (correlation > 0.5) regime = "symmetry breaking";
        else if ((sumEntropy / totalPixels) > 0.1 && sumVortices > 5) regime = "turbulence";

        return { energy: sumEnergy / totalPixels, entropy: sumEntropy / totalPixels, vortices: sumVortices, correlation, regime, anomalies: [], spectralData: spectralPSD };
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

        if (stepIdx % telemetryInterval === 0 && stepIdx !== lastTelemetryStep && !telemetryReductionRunning) {
            lastTelemetryStep = stepIdx;
            executeParallelTelemetry().then(m => {
                if (!m) return;
                if (p.sweepActive > 0.0 && currentRegime === "macroscopic order" && m.regime !== "macroscopic order") {
                    isPlaying = false;
                    currentParams.sweepActive = 0.0;
                    self.postMessage({ type: 'bifurcationDetected', step: stepIdx, mu: currentParams.mu });
                }
                currentRegime = m.regime;

                if (isRecording) telemetryHistory.push({ type: 'telemetry', step: stepIdx, energy: m.energy, entropy: m.entropy, vortices: m.vortices, correlation: m.correlation });
                self.postMessage({ type: 'telemetry', step: stepIdx, energy: m.energy, entropy: m.entropy, vortices: m.vortices, correlation: m.correlation, regime: m.regime, spectralData: m.spectralData, recordedCount: telemetryHistory.length });
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
        else if (e.data.type === 'exportTensor') {
            exportTensorBinary();
        }
        else if (e.data.type === 'pointer') {
            currentParams.mouseRadius = e.data.mouseRadius;
            if (e.data.isDown && currentParams.mouseX !== -1) { currentParams.mouseVelX = e.data.mouseX - currentParams.mouseX; currentParams.mouseVelY = e.data.mouseY - currentParams.mouseY; }
            currentParams.mouseX = e.data.mouseX; currentParams.mouseY = e.data.mouseY;
        }
        else if (e.data.type === 'destroy') {
            cleanup();
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
    const [spectralData, setSpectralData] = useState<number[]>([]);
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
                if (e.data.spectralData) setSpectralData(e.data.spectralData);
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
            } else if (e.data.type === 'tensorExported') {
                const url = URL.createObjectURL(e.data.blob);
                const a = document.createElement("a"); 
                a.href = url; 
                a.download = `qrf_tensor_${e.data.hashHex.slice(0, 8)}_${Date.now()}.bin`;
                a.click(); 
                URL.revokeObjectURL(url);
            }
        };

        worker.postMessage({ type: 'init', canvas: offscreen, shaders: { initWGSL, macroWGSL, computeWGSL, renderWGSL, telemetryWGSL } }, [offscreen]);
        
        return () => {
            worker.postMessage({ type: 'destroy' });
            worker.terminate();
        };
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
                        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Version: 7.1.4 (Isotropic Boundary QRF)</p>
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
                        
                        {spectralData.length > 0 && (
                            <div className="mt-4 bg-black/40 border border-white/5 p-2 rounded">
                                <div className="text-[9px] text-slate-500 font-mono uppercase mb-2 flex justify-between">
                                    <span>Isotropic power density</span>
                                    <span className="text-blue-400">PSD(k)</span>
                                </div>
                                <svg viewBox="0 0 100 20" className="w-full h-8 overflow-visible" preserveAspectRatio="none">
                                    <polyline
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        className="text-blue-400"
                                        points={spectralData.map((v, i) => `${(i / spectralData.length) * 100},${20 - Math.min(20, v * 5000)}`).join(' ')}
                                    />
                                </svg>
                            </div>
                        )}
                    </SidebarSection>

                    <SidebarSection title="Provenance & Export" icon={<Share2 size={12} className="text-blue-500" />}>
                        <div className="flex flex-col gap-2 pt-1">
                            <button onClick={() => workerRef.current?.postMessage({ type: 'exportTensor' })} className="flex-1 flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 py-2.5 rounded text-[10px] font-bold uppercase transition-all">
                                <Download size={14} /> export binary tensor
                            </button>
                            <button onClick={() => workerRef.current?.postMessage({ type: 'exportTelemetryCSV' })} disabled={telemetry.recordedCount === 0} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 disabled:opacity-50 text-indigo-400 border border-indigo-500/30 py-2.5 rounded text-[10px] font-bold uppercase transition-all">
                                <Download size={14} /> export csv telemetry
                            </button>
                        </div>
                    </SidebarSection>

                    <SidebarSection title="Data acquisition" icon={<LineChart size={12} className="text-blue-500" />}>
                        <Slider label="Sampling epoch" value={params.telemetryInterval} min={10} max={300} step={10} onChange={v => handleParamChange('telemetryInterval', v)} format={v => v.toFixed(0)} />
                        <Slider label="Integration limit" value={params.autoPause} min={0} max={10000} step={100} onChange={v => handleParamChange('autoPause', v)} format={v => v === 0 ? 'infinite' : v.toFixed(0)} />
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setIsRecording(!isRecording)} className={`flex-1 flex justify-center items-center gap-1 border py-2.5 rounded text-[10px] font-bold tracking-widest uppercase transition-all ${isRecording ? 'bg-red-600/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-400 border-white/5'}`}>{isRecording ? 'recording' : 'record'}</button>
                            <button onClick={() => workerRef.current?.postMessage({ type: 'setRecording', isRecording: false, clear: true })} className="flex-1 bg-slate-800 text-slate-400 border border-white/5 py-2.5 rounded text-[10px] font-bold uppercase transition-all">clear</button>
                        </div>
                        <div className="flex gap-2 pt-1">
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
                <div className="absolute bottom-8 right-8 z-10 pointer-events-none text-[8px] font-mono text-slate-600 uppercase tracking-[0.3em]" style={{ writingMode: 'vertical-rl' }}>Continuous phase space manifold [HCA-7.1.4]</div>
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
```