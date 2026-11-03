// blackhole.js - Vanilla JS implementation of the blackhole shader
// No React or TypeScript required

/**
 * Initialize the blackhole WebGL canvas
 * @param {HTMLElement} hostElement - Container element for the canvas
 * @param {Object} options - Configuration options
 */
function initBlackHole(hostElement, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "none"; // Hidden until context is ready
  hostElement.appendChild(canvas);

  // Merge defaults with provided options
  const props = {
    distance: 24,
    elevation: -5.5,
    azimuth: 0,
    orbitSpeed: 0,
    roll: -20,
    fov: 42,
    diskInner: 3,
    diskOuter: 15,
    diskThickness: 0.26,
    diskDensity: 1,
    brightness: 1,
    spinSpeed: 0.06,
    grain: 0.48,
    doppler: 0.35,
    hotColor: "#FFF3DE",
    midColor: "#FF9838",
    coolColor: "#8E3A0B",
    starBrightness: 0,
    glow: 1,
    exposure: 0.9,
    vignette: 0.28,
    steps: 150, // Reduced for mobile performance
    resolution: 0.5, // Lower resolution for mobile
    maxDpr: 1, // Lower maxDpr for mobile
    focus: [0.72, 0.46],
    scrim: "none",
    scrimStrength: 0.9,
    paused: false,
    ...options
  };

  // Check for reduced motion preference
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Get WebGL context
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  }) || canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    hostElement.dataset.webgl = "unsupported";
    canvas.style.display = "none";
    return;
  }

  // Detect software renderer
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = dbg
    ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "")
    : "";
  const software = /swiftshader|llvmpipe|softpipe|software|microsoft basic/i.test(renderer);
  const isGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

  // Shader sources - copied EXACTLY from the original
  const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

  const SCENE_FRAG = `
precision highp float;

#define MAX_STEPS 460

#define WIND_CYCLE 46.0

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform vec3  uRight;
uniform vec3  uUp;
uniform vec3  uFwd;
uniform float uTanHalf;
uniform vec2  uFocus;
uniform float uSteps;
uniform float uSkyR;
uniform float uDiskIn;
uniform float uDiskOut;
uniform float uThick;
uniform float uDensity;
uniform float uSpin;
uniform float uGrain;
uniform float uBright;
uniform float uDoppler;
uniform vec3  uHot;
uniform vec3  uMid;
uniform vec3  uCool;
uniform float uStars;
uniform float uEncode;
uniform vec2  uJitter;
uniform float uSeed;

/* --- noise ---------------------------------------------------------------- */

float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

/** lod fades the finest octave out, for rays whose steps are too long to see it. */
float fbm(vec3 p, float lod) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += (i == 3 ? a * lod : a) * vnoise(p);
    p = p * 2.03 + vec3(11.3, 7.1, 3.7);
    a *= 0.5;
  }
  return s;
}

/* --- the gas -------------------------------------------------------------- */

/**
 * Density and colour of the disc at a point.
 */
void gasAt(vec3 p, float rd, float dt, out float dens, out vec3 tint, out float heat) {
  float rn = clamp((rd - uDiskIn) / max(0.001, uDiskOut - uDiskIn), 0.0, 1.0);

  // A thin sheet at the rim, flaring outward.
  float tk = uThick * (0.35 + 1.25 * rn);
  float v = p.y / tk;
  float sheet = exp(-v * v);

  // Detail the ray cannot resolve is detail it should not be asking for.
  float lod = clamp(1.0 - dt * uGrain * 14.0, 0.0, 1.0);

  float phi = atan(p.z, p.x);
  // Kepler: omega goes as r^-3/2, so every radius turns at its own rate
  float omega = uSpin * pow(uDiskIn / rd, 1.5);
  // A third axis, so two radii turning at their own rates do not read the same
  float lr = log(rd) * 1.1 + uSpin * uTime * 0.05;

  // Left alone, that shear never stops winding. Two copies run on clocks
  // half a cycle apart, crossfading from one to the other.
  float u = uTime / WIND_CYCLE;
  float fA = fract(u);
  float fB = fract(u + 0.5);
  float w = abs(2.0 * fA - 1.0);

  float cloudsA = fbm(vec3(vec2(cos(phi + omega * fA * WIND_CYCLE),
                                sin(phi + omega * fA * WIND_CYCLE)) * (rd * uGrain), lr), lod);
  float cloudsB = fbm(vec3(vec2(cos(phi + omega * fB * WIND_CYCLE),
                                sin(phi + omega * fB * WIND_CYCLE)) * (rd * uGrain), lr + 40.0), lod);
  float clouds = mix(cloudsA, cloudsB, w);

  // Squared for density, so gaps go dark
  float filaments = clouds * clouds * 1.75;

  // Bright at the rim, gone by outer edge
  float inner = smoothstep(0.0, 0.07, rn);
  float outer = 1.0 - smoothstep(0.45, 1.0, rn);
  float prof = inner * outer * pow(uDiskIn / rd, 2.0);

  dens = max(0.0, filaments * 1.5 - 0.30) * sheet * prof * uDensity * 4.6;

  // Temperature falls as r^-3/4
  heat = pow(uDiskIn / rd, 0.8) * (0.72 + 0.55 * clouds);
  tint = mix(uCool, uMid, smoothstep(0.10, 0.52, heat));
  tint = mix(tint, uHot, smoothstep(0.52, 1.05, heat));
}

/* --- stars ---------------------------------------------------------------- */

/**
 * Stars are laid out on six faces of a cube
 */
vec3 starField(vec3 d) {
  vec3 a = abs(d);
  vec2 uv;
  float face;
  if (a.x >= a.y && a.x >= a.z)      { uv = d.yz / a.x; face = d.x > 0.0 ? 0.0 : 1.0; }
  else if (a.y >= a.z)               { uv = d.xz / a.y; face = d.y > 0.0 ? 2.0 : 3.0; }
  else                               { uv = d.xy / a.z; face = d.z > 0.0 ? 4.0 : 5.0; }

  vec3 col = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float sc = 90.0 * pow(2.2, float(k));
    vec2 p = uv * sc;
    vec2 id = floor(p);
    vec2 f = fract(p) - 0.5;
    float h = hash13(vec3(id, face * 19.0));
    if (h > 0.965) {
      vec2 off = vec2(hash13(vec3(id, face + 11.0)), hash13(vec3(id, face + 23.0)));
      float dd = length(f - (off - 0.5) * 0.7);
      float s = smoothstep(0.055, 0.0, dd);
      float warm = hash13(vec3(id, face + 51.0));
      col += s * (0.6 + 4.5 * fract(h * 97.0))
           * mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.88, 0.72), warm)
           / pow(2.2, float(k));
    }
  }
  col += vec3(0.013, 0.017, 0.030) * fbm(d * 2.6, 1.0);
  return col;
}

/* --- march ---------------------------------------------------------------- */

void main() {
  vec2 uv = (gl_FragCoord.xy + uJitter - uFocus * uRes) / uRes.y;
  vec3 dir = normalize(uFwd + (uv.x * uRight + uv.y * uUp) * 2.0 * uTanHalf);

  vec3 pos = uCamPos;
  vec3 vel = dir;

  // Angular momentum
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  float h = sqrt(h2);
  float swept = 0.0;

  vec3 col = vec3(0.0);
  float transmit = 1.0;
  bool captured = false;

  float jitter = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);

  for (int i = 0; i < MAX_STEPS; i++) {
    if (float(i) >= uSteps) break;

    float r2 = dot(pos, pos);
    float r = sqrt(r2);

    if (r < 1.0) { captured = true; break; }
    if (r > uSkyR && dot(pos, vel) > 0.0) break;
    if (transmit < 0.004) break;

    float dt = clamp(0.14 * (r - 1.0), 0.025, 1.1);

    if (r < uDiskOut * 1.25) {
      float rn = clamp((r - uDiskIn) / max(0.001, uDiskOut - uDiskIn), 0.0, 1.0);
      float tk = uThick * (0.35 + 1.25 * rn);
      dt = min(dt, max(tk * 0.38, abs(pos.y) * 0.5));
    }

    swept += h * dt / r2;

    float deep = exp(-1.3 * max(0.0, swept - 4.6));

    jitter = fract(jitter + 0.6180339887);
    vec3 mid = pos + vel * (dt * jitter);
    float rd = length(mid.xz);

    if (rd > uDiskIn && rd < uDiskOut && abs(mid.y) < uThick * 5.0) {
      float dens;
      float heat;
      vec3 tint;
      gasAt(mid, rd, dt, dens, tint, heat);

      if (dens > 0.001) {
        // Beaming
        vec3 tang = normalize(cross(vec3(0.0, 1.0, 0.0), vec3(mid.x, 0.0, mid.z)));
        float beta = min(0.85, sqrt(0.5 / max(rd, 1.5)));
        float gam = inversesqrt(max(1e-4, 1.0 - beta * beta));
        vec3 toObs = -normalize(vel);
        float g = 1.0 / (gam * (1.0 - beta * dot(tang, toObs)));
        g *= sqrt(max(0.05, 1.0 - 1.0 / rd));
        float boost = pow(max(g, 0.02), 3.0 * uDoppler);

        vec3 shift = mix(
          vec3(1.0),
          g > 1.0 ? vec3(0.86, 0.94, 1.14) : vec3(1.15, 0.82, 0.62),
          clamp(abs(g - 1.0) * 1.6, 0.0, 1.0) * uDoppler
        );

        float emit = uBright * (0.26 + 2.0 * heat * heat);
        col += tint * shift * (emit * boost * dens * transmit * dt * deep);
        transmit *= exp(-dens * 0.30 * dt);
      }
    }

    // a = -3/2 * h^2 * r / |r|^5
    vec3 acc = -1.5 * h2 * pos / (r2 * r2 * r);
    vel += acc * dt;
    pos += vel * dt;
  }

  if (!captured && uStars > 0.001) {
    vec3 toHole = normalize(-uCamPos);
    float sI = length(cross(normalize(dir), toHole));
    float sS = length(cross(normalize(vel), toHole));
    float stretch = clamp(sI / max(1e-3, sS), 1.0, 40.0);
    col += starField(normalize(vel)) * uStars * transmit / stretch;
  }

  if (uEncode > 0.5) col = col / (1.0 + col);
  gl_FragColor = vec4(col, 1.0);
}
`;

  const BLEND_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uCur;
uniform sampler2D uPrev;
uniform float uAlpha;

void main() {
  vec3 c = texture2D(uCur, vUv).rgb;
  vec3 p = texture2D(uPrev, vUv).rgb;
  gl_FragColor = vec4(mix(p, c, uAlpha), 1.0);
}
`;

  const BRIGHT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uDecode;
uniform float uPack;
uniform float uThreshold;

void main() {
  vec3 s = texture2D(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2(-1.0,  1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
  s *= 0.25;
  if (uDecode > 0.5) s = s / max(vec3(0.002), 1.0 - s);
  float l = max(s.r, max(s.g, s.b));
  s *= max(0.0, l - uThreshold) / max(0.0001, l);
  gl_FragColor = vec4(s * uPack, 1.0);
}
`;

  const BLUR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;

void main() {
  vec3 s = texture2D(uTex, vUv).rgb * 0.2270270;
  s += (texture2D(uTex, vUv + uStep * 1.3846154).rgb
      + texture2D(uTex, vUv - uStep * 1.3846154).rgb) * 0.3162162;
  s += (texture2D(uTex, vUv + uStep * 3.2307692).rgb
      + texture2D(uTex, vUv - uStep * 3.2307692).rgb) * 0.0702702;
  gl_FragColor = vec4(s, 1.0);
}
`;

  const COMPOSITE_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2  uRes;
uniform float uDecode;
uniform float uPack;
uniform float uGlow;
uniform float uExposure;
uniform float uVignette;
uniform float uScrimDir;
uniform float uScrimAmt;
uniform float uSeed;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 scene = texture2D(uScene, vUv).rgb;
  if (uDecode > 0.5) scene = scene / max(vec3(0.002), 1.0 - scene);
  vec3 bloom = texture2D(uBloom, vUv).rgb / uPack;

  vec3 c = scene + bloom * uGlow;
  c = aces(c * uExposure);
  c = pow(max(c, 0.0), vec3(0.4545));

  // Corners down
  vec2 d = vUv - 0.5;
  c *= 1.0 - uVignette * dot(d, d) * 1.9;

  // Edge scrim
  if (uScrimDir > 0.5) {
    float x = uScrimDir < 1.5 ? vUv.x
            : uScrimDir < 2.5 ? 1.0 - vUv.x
            : uScrimDir < 3.5 ? 1.0 - vUv.y
            : vUv.y;
    c *= 1.0 - uScrimAmt * pow(1.0 - clamp(x, 0.0, 1.0), 2.4);
  }

  // Dither
  float n = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) / 255.0;

  gl_FragColor = vec4(c, 1.0);
}
`;

  // Helper functions
  const RAD = Math.PI / 180;

  function hexToLinear(hex) {
    const h = hex.trim().replace("#", "");
    const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h.slice(0, 6);
    const n = parseInt(full, 16);
    const srgb = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    return srgb.map((v) =>
      v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
  }

  function compile(type, src) {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error("blackhole: shader failed —", gl.getShaderInfoLog(sh) || "no log (context lost?)");
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function link(fragSrc) {
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return null;
    }
    const u = {};
    const n = gl.getActiveUniform(program, 0);
    for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) u[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, u };
  }

  function makeTarget(w, h) {
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    if (!tex || !fb) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteTexture(tex);
      gl.deleteFramebuffer(fb);
      return null;
    }
    return { fb, tex, w, h };
  }

  // Build resources
  let sceneProg = link(SCENE_FRAG);
  let blendProg = link(BLEND_FRAG);
  let brightProg = link(BRIGHT_FRAG);
  let blurProg = link(BLUR_FRAG);
  let compProg = link(COMPOSITE_FRAG);

  if (!sceneProg || !blendProg || !brightProg || !blurProg || !compProg) {
    hostElement.dataset.webgl = "build-failed";
    canvas.style.display = "none";
    return;
  }

  // VBO - one big triangle
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);

  // Render targets
  let scene = null, histA = null, histB = null, bloomA = null, bloomB = null;
  let settled = 0;
  let width = 0, height = 0, sceneW = 0, sceneH = 0;

  function dropTargets() {
    [scene, histA, histB, bloomA, bloomB].forEach(t => {
      if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); }
    });
    scene = histA = histB = bloomA = bloomB = null;
    settled = 0;
  }

  function resize() {
    const rect = hostElement.getBoundingClientRect();
    const dpr = software ? 1 : Math.min(window.devicePixelRatio || 1, props.maxDpr);
    const cssW = Math.max(1, Math.round(rect.width));
    const cssH = Math.max(1, Math.round(rect.height));
    const scale = software ? 0.34 : Math.min(1, Math.max(0.4, props.resolution));
    const w = Math.max(2, Math.round(cssW * dpr));
    const h = Math.max(2, Math.round(cssH * dpr));
    const sw = Math.max(2, Math.round(w * scale));
    const sh = Math.max(2, Math.round(h * scale));

    if (w === width && h === height && sw === sceneW && sh === sceneH) return;

    width = w; height = h;
    sceneW = sw; sceneH = sh;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    dropTargets();
    scene = makeTarget(sw, sh);
    histA = makeTarget(sw, sh);
    histB = makeTarget(sw, sh);
    const bw = Math.max(2, sw >> 2);
    const bh = Math.max(2, sh >> 2);
    bloomA = makeTarget(bw, bh);
    bloomB = makeTarget(bw, bh);
  }

  // Draw helpers
  function pass(prog, target) {
    gl.useProgram(prog.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, target ? target.w : width, target ? target.h : height);
  }

  function draw() {
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function bind(tex, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  const HALTON = [
    [0.5, 0.333], [0.25, 0.667], [0.75, 0.111], [0.125, 0.444],
    [0.625, 0.778], [0.375, 0.222], [0.875, 0.556], [0.0625, 0.889],
  ];

  // Clock
  let clock = reduced ? 6 : 0;
  let lastFrame = 0;
  let running = true;
  let visible = true;
  let raf = 0;

  function render(t) {
    if (!sceneProg || !blendProg || !brightProg || !blurProg || !compProg) return;
    if (!scene || !histA || !histB || !bloomA || !bloomB) return;

    // Camera
    const az = (props.azimuth + props.orbitSpeed * t) * RAD;
    const el = Math.max(-88, Math.min(88, props.elevation)) * RAD;
    const dist = Math.max(2.2, props.distance);
    const ce = Math.cos(el);
    const camX = dist * ce * Math.cos(az);
    const camY = dist * Math.sin(el);
    const camZ = dist * ce * Math.sin(az);

    const fx = -camX / dist, fy = -camY / dist, fz = -camZ / dist;
    let rx = fz, ry = 0, rz = -fx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl; ry /= rl; rz /= rl;
    let ux = ry * fz - rz * fy;
    let uy = rz * fx - rx * fz;
    let uz = rx * fy - ry * fx;
    const cr = Math.cos(props.roll * RAD);
    const sr = Math.sin(props.roll * RAD);
    const RX = rx * cr + ux * sr, RY = ry * cr + uy * sr, RZ = rz * cr + uz * sr;
    const UX = -rx * sr + ux * cr, UY = -ry * sr + uy * cr, UZ = -rz * sr + uz * cr;

    const hot = hexToLinear(props.hotColor);
    const mid = hexToLinear(props.midColor);
    const cool = hexToLinear(props.coolColor);
    const outer = Math.max(props.diskInner + 0.5, props.diskOuter);

    // Scene pass
    pass(sceneProg, scene);
    const u = sceneProg.u;
    gl.uniform2f(u.uRes, scene.w, scene.h);
    gl.uniform1f(u.uTime, t);
    gl.uniform3f(u.uCamPos, camX, camY, camZ);
    gl.uniform3f(u.uRight, RX, RY, RZ);
    gl.uniform3f(u.uUp, UX, UY, UZ);
    gl.uniform3f(u.uFwd, fx, fy, fz);
    gl.uniform1f(u.uTanHalf, Math.tan(Math.max(8, Math.min(110, props.fov)) * 0.5 * RAD));
    gl.uniform2f(u.uFocus, props.focus[0], 1 - props.focus[1]);
    gl.uniform1f(u.uSteps, software ? 130 : Math.max(60, Math.min(460, Math.round(props.steps))));
    gl.uniform1f(u.uSkyR, Math.max(dist * 1.35, outer * 2.4));
    gl.uniform1f(u.uDiskIn, Math.max(1.05, props.diskInner));
    gl.uniform1f(u.uDiskOut, outer);
    gl.uniform1f(u.uThick, Math.max(0.02, props.diskThickness));
    gl.uniform1f(u.uDensity, Math.max(0, props.diskDensity));
    gl.uniform1f(u.uSpin, props.spinSpeed * 6.2831853);
    gl.uniform1f(u.uGrain, Math.max(0.02, props.grain));
    gl.uniform1f(u.uBright, Math.max(0, props.brightness));
    gl.uniform1f(u.uDoppler, Math.max(0, Math.min(1, props.doppler)));
    gl.uniform3f(u.uHot, hot[0], hot[1], hot[2]);
    gl.uniform3f(u.uMid, mid[0], mid[1], mid[2]);
    gl.uniform3f(u.uCool, cool[0], cool[1], cool[2]);
    gl.uniform1f(u.uStars, Math.max(0, props.starBrightness));
    gl.uniform1f(u.uEncode, 0);
    const h = HALTON[settled % HALTON.length];
    gl.uniform2f(u.uJitter, h[0] - 0.5, h[1] - 0.5);
    gl.uniform1f(u.uSeed, (settled % 64) * 17.13);
    draw();

    // Blend into history
    const alpha = settled === 0 ? 1 : 0.14;
    pass(blendProg, histB);
    bind(scene.tex, 0);
    bind(histA.tex, 1);
    gl.uniform1i(blendProg.u.uCur, 0);
    gl.uniform1i(blendProg.u.uPrev, 1);
    gl.uniform1f(blendProg.u.uAlpha, alpha);
    draw();
    const shown = histB;
    histA = histB;
    histB = shown;
    settled++;

    // Bright pass
    pass(brightProg, bloomA);
    bind(shown.tex, 0);
    gl.uniform1i(brightProg.u.uTex, 0);
    gl.uniform2f(brightProg.u.uTexel, 1 / shown.w, 1 / shown.h);
    gl.uniform1f(brightProg.u.uDecode, 0);
    gl.uniform1f(brightProg.u.uPack, 1);
    gl.uniform1f(brightProg.u.uThreshold, 0.85);
    draw();

    // Blur passes
    function blurStep(src, dst, dx, dy) {
      pass(blurProg, dst);
      bind(src.tex, 0);
      gl.uniform1i(blurProg.u.uTex, 0);
      gl.uniform2f(blurProg.u.uStep, dx / dst.w, dy / dst.h);
      draw();
    }
    blurStep(bloomA, bloomB, 1, 0);
    blurStep(bloomB, bloomA, 0, 1);
    blurStep(bloomA, bloomB, 2.6, 0);
    blurStep(bloomB, bloomA, 0, 2.6);

    // Composite
    pass(compProg, null);
    bind(shown.tex, 0);
    bind(bloomA.tex, 1);
    gl.uniform1i(compProg.u.uScene, 0);
    gl.uniform1i(compProg.u.uBloom, 1);
    gl.uniform2f(compProg.u.uRes, width, height);
    gl.uniform1f(compProg.u.uDecode, 0);
    gl.uniform1f(compProg.u.uPack, 1);
    gl.uniform1f(compProg.u.uGlow, Math.max(0, props.glow) * 0.26);
    gl.uniform1f(compProg.u.uExposure, Math.max(0.05, props.exposure));
    gl.uniform1f(compProg.u.uVignette, Math.max(0, Math.min(1, props.vignette)));
    gl.uniform1f(compProg.u.uScrimDir,
      props.scrim === "left" ? 1 : props.scrim === "right" ? 2 : props.scrim === "top" ? 3 : props.scrim === "bottom" ? 4 : 0);
    gl.uniform1f(compProg.u.uScrimAmt, Math.max(0, Math.min(1, props.scrimStrength)));
    gl.uniform1f(compProg.u.uSeed, (t * 60) % 1000);
    draw();
  }

  function settle(passes) {
    for (let i = 0; i < passes; i++) render(clock);
  }

  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (!visible) { lastFrame = now; return; }
    const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    if (!props.paused && !reduced) clock += dt;
    render(clock);
  }

  resize();
  settle(reduced ? 16 : 1);

  if (!reduced) raf = requestAnimationFrame(tick);

  // Resize observer
  const ro = new ResizeObserver(() => {
    resize();
    if (reduced || props.paused) settle(16);
  });
  ro.observe(hostElement);

  // Intersection observer
  const io = new IntersectionObserver(
    (entries) => { visible = entries[0]?.isIntersecting ?? true; },
    { threshold: 0 }
  );
  io.observe(hostElement);

  // Visibility change
  const onVisibility = () => { visible = !document.hidden; lastFrame = 0; };
  document.addEventListener("visibilitychange", onVisibility);

  // Context lost
  const onLost = (e) => {
    e.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
    canvas.style.display = "none";
  };
  const onRestored = () => {
    width = height = sceneW = sceneH = 0;
    if (!sceneProg) {
      hostElement.dataset.webgl = "lost";
      return;
    }
    canvas.style.display = "";
    hostElement.dataset.webgl = "";
    resize();
    running = true;
    lastFrame = 0;
    settle(reduced ? 16 : 1);
    if (!reduced) raf = requestAnimationFrame(tick);
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  // Cleanup
  function cleanup() {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    dropTargets();
    if (vbo) gl.deleteBuffer(vbo);
    [sceneProg, blendProg, brightProg, blurProg, compProg].forEach(p => {
      if (p) gl.deleteProgram(p.program);
    });
  }

  return { cleanup, canvas };
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  const heroBlackhole = document.querySelector(".hero-blackhole");
  if (heroBlackhole) {
    const result = initBlackHole(heroBlackhole, {
      steps: 150,
      resolution: 0.5,
      maxDpr: 1,
      spinSpeed: 0.06,
      diskDensity: 1,
      brightness: 1,
      exposure: 0.9,
      glow: 1,
      scrim: "left",
      scrimStrength: 0.9,
    });

    if (!result) {
      // WebGL failed - show the gradient overlay that's already in HTML
      console.warn("WebGL not supported, using gradient fallback");
    }
  }
});
