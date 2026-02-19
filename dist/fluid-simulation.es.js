const ye = {
  alpha: !1,
  preserveDrawingBuffer: !0,
  desynchronized: !0,
  powerPreference: "high-performance"
};
class Re {
  canvas;
  gl;
  extFloat;
  extHalfFloat;
  extFloatLinear;
  extHalfFloatLinear;
  extColorBufferHalfFloat;
  vertexBuffer = null;
  indexBuffer = null;
  constructor(e) {
    this.canvas = e;
    const t = e.getContext("webgl", ye);
    if (!t)
      throw new Error("WebGL not supported. Please use a modern browser.");
    this.gl = t, this.extFloat = t.getExtension("OES_texture_float"), this.extHalfFloat = t.getExtension("OES_texture_half_float"), this.extFloatLinear = t.getExtension("OES_texture_float_linear"), this.extHalfFloatLinear = t.getExtension("OES_texture_half_float_linear"), this.extColorBufferHalfFloat = t.getExtension("EXT_color_buffer_half_float"), this.initGeometry();
  }
  initGeometry() {
    const { gl: e } = this;
    this.vertexBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bufferData(e.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), e.STATIC_DRAW), this.indexBuffer = e.createBuffer(), e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.indexBuffer), e.bufferData(e.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), e.STATIC_DRAW);
  }
  compileShader(e, t) {
    const { gl: r } = this, o = r.createShader(e);
    if (!o)
      throw new Error(`Failed to create ${e === r.VERTEX_SHADER ? "vertex" : "fragment"} shader`);
    if (r.shaderSource(o, t), r.compileShader(o), !r.getShaderParameter(o, r.COMPILE_STATUS)) {
      const i = r.getShaderInfoLog(o);
      throw r.deleteShader(o), new Error(`Shader compilation failed: ${i}`);
    }
    return o;
  }
  createProgram(e, t) {
    const { gl: r } = this, o = this.compileShader(r.VERTEX_SHADER, e), i = this.compileShader(r.FRAGMENT_SHADER, t), n = r.createProgram();
    if (!n)
      throw new Error("Failed to create WebGL program");
    if (r.attachShader(n, o), r.attachShader(n, i), r.linkProgram(n), !r.getProgramParameter(n, r.LINK_STATUS)) {
      const s = r.getProgramInfoLog(n);
      throw r.deleteProgram(n), new Error(`Program linking failed: ${s}`);
    }
    const a = {}, c = r.getProgramParameter(n, r.ACTIVE_UNIFORMS);
    for (let s = 0; s < c; s++) {
      const d = r.getActiveUniform(n, s);
      d && (a[d.name] = r.getUniformLocation(n, d.name));
    }
    return { program: n, uniforms: a };
  }
  createFBO(e, t, r, o, i, n) {
    const { gl: a } = this;
    a.activeTexture(a.TEXTURE0);
    const c = a.createTexture();
    if (!c)
      throw new Error("Failed to create texture");
    a.bindTexture(a.TEXTURE_2D, c), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MIN_FILTER, n), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MAG_FILTER, n), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_S, a.CLAMP_TO_EDGE), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_T, a.CLAMP_TO_EDGE), a.texImage2D(a.TEXTURE_2D, 0, r, e, t, 0, o, i, null);
    const s = a.createFramebuffer();
    if (!s)
      throw new Error("Failed to create framebuffer");
    a.bindFramebuffer(a.FRAMEBUFFER, s), a.framebufferTexture2D(a.FRAMEBUFFER, a.COLOR_ATTACHMENT0, a.TEXTURE_2D, c, 0), a.viewport(0, 0, e, t), a.clear(a.COLOR_BUFFER_BIT);
    const d = this;
    return {
      texture: c,
      fbo: s,
      width: e,
      height: t,
      attach(p) {
        return d.gl.activeTexture(d.gl.TEXTURE0 + p), d.gl.bindTexture(d.gl.TEXTURE_2D, c), p;
      }
    };
  }
  createDoubleFBO(e, t, r, o, i, n) {
    let a = this.createFBO(e, t, r, o, i, n), c = this.createFBO(e, t, r, o, i, n);
    return {
      width: e,
      height: t,
      texelSizeX: 1 / e,
      texelSizeY: 1 / t,
      get read() {
        return a;
      },
      set read(s) {
        a = s;
      },
      get write() {
        return c;
      },
      set write(s) {
        c = s;
      },
      swap() {
        const s = a;
        a = c, c = s;
      }
    };
  }
  getSupportedFormat(e, t, r) {
    const { gl: o } = this;
    return this.supportRenderTextureFormat(e, t, r) ? { internalFormat: e, format: t, type: r } : e === o.RGBA ? this.getSupportedFormat(o.RGBA, o.RGBA, o.UNSIGNED_BYTE) : null;
  }
  supportRenderTextureFormat(e, t, r) {
    const { gl: o } = this, i = o.createTexture();
    o.bindTexture(o.TEXTURE_2D, i), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MIN_FILTER, o.NEAREST), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MAG_FILTER, o.NEAREST), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_S, o.CLAMP_TO_EDGE), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_T, o.CLAMP_TO_EDGE), o.texImage2D(o.TEXTURE_2D, 0, e, 4, 4, 0, t, r, null);
    const n = o.createFramebuffer();
    o.bindFramebuffer(o.FRAMEBUFFER, n), o.framebufferTexture2D(o.FRAMEBUFFER, o.COLOR_ATTACHMENT0, o.TEXTURE_2D, i, 0);
    const a = o.checkFramebufferStatus(o.FRAMEBUFFER);
    return o.deleteFramebuffer(n), o.deleteTexture(i), a === o.FRAMEBUFFER_COMPLETE;
  }
  blit(e) {
    const { gl: t } = this;
    e === null ? (t.viewport(0, 0, t.drawingBufferWidth, t.drawingBufferHeight), t.bindFramebuffer(t.FRAMEBUFFER, null)) : (t.viewport(0, 0, e.width, e.height), t.bindFramebuffer(t.FRAMEBUFFER, e.fbo)), t.drawElements(t.TRIANGLES, 6, t.UNSIGNED_SHORT, 0);
  }
  prepareRender() {
    const { gl: e } = this;
    e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.indexBuffer), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0), e.enableVertexAttribArray(0);
  }
  dispose() {
    const { gl: e } = this;
    this.vertexBuffer && e.deleteBuffer(this.vertexBuffer), this.indexBuffer && e.deleteBuffer(this.indexBuffer), this.vertexBuffer = null, this.indexBuffer = null;
  }
}
const R = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`, we = `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;
  varying vec2 vUv;

  void main() {
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    vec2 coord = vUv - dt * velocity;
    vec3 result = dissipation * texture2D(uSource, coord).xyz;
    gl_FragColor = vec4(result, 1.0);
  }
`, Ce = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float value;
  varying vec2 vUv;

  void main() {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`, ke = `
  precision highp float;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`, Ie = `
  precision highp float;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`, Le = `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`, Oe = `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`, _e = `
  precision highp float;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`, Be = `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  uniform float damping;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;

    float speed = length(velocity);
    float dampingFactor = 1.0 / (1.0 + speed * damping * 2.0);
    force *= dampingFactor;

    velocity += force * dt;
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`, Fe = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 texelSize;
  uniform vec2 direction;
  varying vec2 vUv;

  void main() {
    vec3 color = vec3(0.0);
    vec2 off1 = vec2(1.3846153846) * direction * texelSize;
    vec2 off2 = vec2(3.2307692308) * direction * texelSize;
    color += texture2D(uTexture, vUv).rgb * 0.2270270270;
    color += texture2D(uTexture, vUv + off1).rgb * 0.3162162162;
    color += texture2D(uTexture, vUv - off1).rgb * 0.3162162162;
    color += texture2D(uTexture, vUv + off2).rgb * 0.0702702703;
    color += texture2D(uTexture, vUv - off2).rgb * 0.0702702703;
    gl_FragColor = vec4(color, 1.0);
  }
`, Ae = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform sampler2D uBloom;
  uniform float intensity;
  varying vec2 vUv;

  void main() {
    vec3 color = texture2D(uTexture, vUv).rgb;
    vec3 bloom = texture2D(uBloom, vUv).rgb;
    color += bloom * intensity;
    color = color / (1.0 + color);
    gl_FragColor = vec4(color, 1.0);
  }
`, Me = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec3 curve;
  uniform float threshold;
  varying vec2 vUv;

  void main() {
    vec3 c = texture2D(uTexture, vUv).rgb;
    float br = max(c.r, max(c.g, c.b));
    float rq = clamp(br - curve.x, 0.0, curve.y);
    rq = curve.z * rq * rq;
    c *= max(rq, br - threshold) / max(br, 0.0001);
    gl_FragColor = vec4(c, 1.0);
  }
`, Ue = `
  precision highp float;
  uniform sampler2D uTexture;
  varying vec2 vUv;

  void main() {
    vec3 color = texture2D(uTexture, vUv).rgb;
    gl_FragColor = vec4(color, 1.0);
  }
`, Pe = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform sampler2D uBloom;
  uniform float bloomIntensity;
  uniform float vignetteAmount;
  uniform float sharpness;
  varying vec2 vUv;

  void main() {
    vec3 color = texture2D(uTexture, vUv).rgb;
    vec3 bloom = texture2D(uBloom, vUv).rgb;

    color += bloom * bloomIntensity;

    if (sharpness > 0.0) {
      vec3 blurred = (texture2D(uTexture, vUv + vec2(0.001, 0.0)).rgb +
                      texture2D(uTexture, vUv - vec2(0.001, 0.0)).rgb +
                      texture2D(uTexture, vUv + vec2(0.0, 0.001)).rgb +
                      texture2D(uTexture, vUv - vec2(0.0, 0.001)).rgb) * 0.25;
      color += (color - blurred) * sharpness;
    }

    color = pow(color, vec3(0.95));
    color = color / (1.0 + color * 0.5);

    if (vignetteAmount > 0.0) {
      vec2 uv = vUv * (1.0 - vUv.yx);
      float vig = uv.x * uv.y * 15.0;
      vig = pow(vig, 0.15 * vignetteAmount);
      color *= mix(1.0, vig, vignetteAmount);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`, D = {
  rainbow: {
    name: "Rainbow",
    colors: [
      [0, 1],
      [0.1, 1],
      [0.2, 1],
      [0.3, 1],
      [0.4, 1],
      [0.5, 1],
      [0.6, 1],
      [0.7, 1],
      [0.8, 1],
      [0.9, 1]
    ]
  },
  ocean: {
    name: "Ocean",
    colors: [
      [0.5, 0.9],
      [0.52, 0.85],
      [0.55, 0.95],
      [0.58, 0.8],
      [0.6, 0.9]
    ]
  },
  fire: {
    name: "Fire",
    colors: [
      [0, 1],
      [0.02, 0.95],
      [0.05, 0.9],
      [0.08, 0.85],
      [0.1, 1]
    ]
  },
  neon: {
    name: "Neon",
    colors: [
      [0.83, 1],
      [0.5, 1],
      [0.33, 1],
      [0.16, 1]
    ]
  },
  sunset: {
    name: "Sunset",
    colors: [
      [0, 1],
      [0.05, 0.9],
      [0.08, 0.95],
      [0.95, 0.85],
      [0.9, 0.8]
    ]
  },
  aurora: {
    name: "Aurora",
    colors: [
      [0.4, 0.9],
      [0.45, 0.95],
      [0.5, 0.85],
      [0.55, 1],
      [0.85, 0.9]
    ]
  },
  cyberpunk: {
    name: "Cyberpunk",
    colors: [
      [0.83, 1],
      [0.92, 1],
      [0.5, 1],
      [0.58, 0.9]
    ]
  },
  forest: {
    name: "Forest",
    colors: [
      [0.25, 0.7],
      [0.28, 0.8],
      [0.33, 0.6],
      [0.35, 0.75],
      [0.4, 0.5]
    ]
  },
  monochrome: {
    name: "Monochrome",
    colors: [
      [0, 0],
      [0, 0.1],
      [0, 0.05],
      [0, 0.02]
    ]
  },
  pastel: {
    name: "Pastel",
    colors: [
      [0, 0.4],
      [0.1, 0.35],
      [0.55, 0.4],
      [0.75, 0.35],
      [0.9, 0.4]
    ]
  },
  custom: {
    name: "Custom",
    colors: []
  }
}, ie = {
  SHOW_UI: !0,
  AUTO_SAVE: !0,
  SIM_RESOLUTION: 256,
  DYE_RESOLUTION: 1024,
  DENSITY_DISSIPATION: 0.98,
  VELOCITY_DISSIPATION: 0.99,
  VELOCITY_DAMPING: 0.5,
  PRESSURE_ITERATIONS: 20,
  CURL: 30,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6e3,
  AUTO_SPLATS: !0,
  AUTO_SPLAT_FORCE: 500,
  BLOOM: !0,
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  SHARPNESS: 0,
  VIGNETTE: 0.5,
  TURBULENCE: 0,
  MARBLING: !1,
  MARBLING_INTENSITY: 0.5,
  COLOR_PALETTE: "custom",
  CUSTOM_COLORS: [
    { hex: "#FF00FF", enabled: !0 },
    { hex: "#00ff00", enabled: !1 },
    { hex: "#0000ff", enabled: !1 }
  ],
  PAUSED: !1,
  RGB_MODE: !0,
  RGB_SPEED: 1,
  COLOR_INTENSITY: 0.15,
  TARGET_FPS: 60
};
let $ = "fluidSimConfig";
function De(u) {
  $ = u;
}
const l = { ...ie }, Ne = {
  SIM_RESOLUTION: { min: 32, max: 1024 },
  DYE_RESOLUTION: { min: 128, max: 4096 },
  DENSITY_DISSIPATION: { min: 0.9, max: 1 },
  VELOCITY_DISSIPATION: { min: 0.9, max: 1 },
  VELOCITY_DAMPING: { min: 0, max: 5 },
  PRESSURE_ITERATIONS: { min: 1, max: 100 },
  CURL: { min: 0, max: 200 },
  SPLAT_RADIUS: { min: 0.01, max: 2 },
  SPLAT_FORCE: { min: 100, max: 2e4 },
  AUTO_SPLAT_FORCE: { min: 10, max: 2e3 },
  BLOOM_INTENSITY: { min: 0, max: 5 },
  BLOOM_THRESHOLD: { min: 0, max: 1 },
  SHARPNESS: { min: 0, max: 5 },
  VIGNETTE: { min: 0, max: 1 },
  TURBULENCE: { min: 0, max: 2 },
  MARBLING_INTENSITY: { min: 0.1, max: 5 },
  RGB_SPEED: { min: 0.1, max: 10 },
  COLOR_INTENSITY: { min: 0.01, max: 1 },
  TARGET_FPS: { min: 0, max: 300 }
};
function g(u, e) {
  const t = Ne[u];
  t && typeof e == "number" && (e = Math.max(t.min, Math.min(t.max, e))), l[u] = e, l.AUTO_SAVE && u !== "AUTO_SAVE" && te();
}
function ee() {
  Object.assign(l, ie), pe();
}
function Q() {
  return { ...l };
}
function te() {
  try {
    localStorage.setItem($, JSON.stringify(l));
  } catch (u) {
    console.warn("Failed to save config:", u);
  }
}
function He(u) {
  if (typeof u != "object" || u === null) return !1;
  const e = [
    "SHOW_UI",
    "AUTO_SAVE",
    "SIM_RESOLUTION",
    "DYE_RESOLUTION",
    "DENSITY_DISSIPATION",
    "VELOCITY_DISSIPATION",
    "VELOCITY_DAMPING",
    "PRESSURE_ITERATIONS",
    "CURL",
    "SPLAT_RADIUS",
    "SPLAT_FORCE",
    "AUTO_SPLATS",
    "AUTO_SPLAT_FORCE",
    "BLOOM",
    "BLOOM_INTENSITY",
    "BLOOM_THRESHOLD",
    "COLOR_PALETTE",
    "CUSTOM_COLORS",
    "PAUSED",
    "SHARPNESS",
    "VIGNETTE",
    "TURBULENCE",
    "MARBLING",
    "MARBLING_INTENSITY",
    "RGB_MODE",
    "RGB_SPEED",
    "COLOR_INTENSITY",
    "TARGET_FPS"
  ];
  return Object.keys(u).every((r) => e.includes(r));
}
function ue() {
  try {
    const u = localStorage.getItem($);
    if (u) {
      const e = JSON.parse(u);
      if (He(e))
        return Object.assign(l, ie, e), !0;
      console.warn("Invalid config format, using defaults");
    }
  } catch (u) {
    console.warn("Failed to load config:", u);
  }
  return !1;
}
function pe() {
  try {
    localStorage.removeItem($);
  } catch (u) {
    console.warn("Failed to clear saved config:", u);
  }
}
function Ye() {
  ue();
}
function fe(u) {
  const e = (u ?? "").trim();
  let t = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
  return t ? {
    r: parseInt(t[1], 16),
    g: parseInt(t[2], 16),
    b: parseInt(t[3], 16)
  } : (t = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(e), t ? {
    r: parseInt(t[1] + t[1], 16),
    g: parseInt(t[2] + t[2], 16),
    b: parseInt(t[3] + t[3], 16)
  } : null);
}
function oe(u, e = { r: 255, g: 255, b: 255 }) {
  const t = fe(u);
  return t || (console.warn(`Invalid hex color: ${u}, using fallback`), e);
}
function Ge(u, e = { r: 1, g: 1, b: 1 }) {
  const t = fe(u);
  return t ? {
    r: t.r / 255,
    g: t.g / 255,
    b: t.b / 255
  } : (console.warn(`Invalid hex color: ${u}, using fallback`), e);
}
function he(u, e, t) {
  const r = (o) => Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, "0");
  return `#${r(u)}${r(e)}${r(t)}`;
}
function Z(u) {
  const e = oe(u), t = e.r / 255, r = e.g / 255, o = e.b / 255, i = Math.max(t, r, o), n = Math.min(t, r, o), a = i - n;
  let c = 0;
  const s = i === 0 ? 0 : a / i, d = i;
  if (a !== 0)
    switch (i) {
      case t:
        c = ((r - o) / a + (r < o ? 6 : 0)) * 60;
        break;
      case r:
        c = ((o - t) / a + 2) * 60;
        break;
      case o:
        c = ((t - r) / a + 4) * 60;
        break;
    }
  return { h: c, s, v: d };
}
function z(u) {
  const { h: e, s: t, v: r } = u, o = r * t, i = o * (1 - Math.abs(e / 60 % 2 - 1)), n = r - o;
  let a = 0, c = 0, s = 0;
  return e < 60 ? (a = o, c = i) : e < 120 ? (a = i, c = o) : e < 180 ? (c = o, s = i) : e < 240 ? (c = i, s = o) : e < 300 ? (a = i, s = o) : (a = o, s = i), he(
    Math.round((a + n) * 255),
    Math.round((c + n) * 255),
    Math.round((s + n) * 255)
  );
}
function se(u) {
  const { h: e, s: t, v: r } = u, o = r * (1 - t / 2), i = o === 0 || o === 1 ? 0 : (r - o) / Math.min(o, 1 - o);
  return { h: e, s: i * 100, l: o * 100 };
}
function Xe(u) {
  const { h: e, s: t, l: r } = u, o = t / 100, i = r / 100, n = i + o * Math.min(i, 1 - i), a = n === 0 ? 0 : 2 * (1 - i / n);
  return { h: e, s: a, v: n };
}
function ze(u, e, t) {
  let r = 0, o = 0, i = 0;
  const n = Math.floor(u * 6), a = u * 6 - n, c = t * (1 - e), s = t * (1 - a * e), d = t * (1 - (1 - a) * e);
  switch (n % 6) {
    case 0:
      r = t, o = d, i = c;
      break;
    case 1:
      r = s, o = t, i = c;
      break;
    case 2:
      r = c, o = t, i = d;
      break;
    case 3:
      r = c, o = s, i = t;
      break;
    case 4:
      r = d, o = c, i = t;
      break;
    case 5:
      r = t, o = c, i = s;
      break;
  }
  return { r, g: o, b: i };
}
class Ve {
  colorIndex = 0;
  colorT = 0;
  /** Update the cycle progress based on delta time */
  update(e, t, r) {
    if (!(r <= 1))
      for (this.colorT += e * t; this.colorT >= 1; )
        this.colorT -= 1, this.colorIndex = (this.colorIndex + 1) % r;
  }
  /** Get the current interpolation values */
  getInterpolation(e) {
    return {
      index: this.colorIndex,
      nextIndex: (this.colorIndex + 1) % e,
      t: this.colorT
    };
  }
  /** Reset the cycle state */
  reset() {
    this.colorIndex = 0, this.colorT = 0;
  }
}
const me = new Ve();
function ge(u, e, t) {
  return ze(u, e, t);
}
function be(u) {
  return Ge(u);
}
function N() {
  if (l.COLOR_PALETTE === "custom") {
    const c = l.CUSTOM_COLORS.filter((v) => v.enabled);
    if (c.length === 0)
      return { r: 0.15, g: 0.15, b: 0.15 };
    const s = c[Math.floor(Math.random() * c.length)], d = be(s.hex), p = 0.9 + Math.random() * 0.1, m = l.COLOR_INTENSITY;
    return {
      r: d.r * m * p,
      g: d.g * m * p,
      b: d.b * m * p
    };
  }
  const u = D[l.COLOR_PALETTE], e = u.colors[Math.floor(Math.random() * u.colors.length)], [t, r] = e, o = t + (Math.random() - 0.5) * 0.05, i = r * (0.9 + Math.random() * 0.1), n = ge(o, i, 1), a = l.COLOR_INTENSITY;
  return n.r *= a, n.g *= a, n.b *= a, n;
}
function $e(u, e, t) {
  return {
    r: u.r + (e.r - u.r) * t,
    g: u.g + (e.g - u.g) * t,
    b: u.b + (e.b - u.b) * t
  };
}
function ve() {
  if (l.COLOR_PALETTE === "custom") {
    const t = l.CUSTOM_COLORS.filter((r) => r.enabled);
    return t.length === 0 ? [{ r: 0.15, g: 0.15, b: 0.15 }] : t.map((r) => {
      const o = be(r.hex), i = l.COLOR_INTENSITY;
      return { r: o.r * i, g: o.g * i, b: o.b * i };
    });
  }
  const u = D[l.COLOR_PALETTE], e = l.COLOR_INTENSITY;
  return u.colors.map(([t, r]) => {
    const o = ge(t, r, 1);
    return { r: o.r * e, g: o.g * e, b: o.b * e };
  });
}
function We(u) {
  if (!l.RGB_MODE) return;
  const e = ve();
  me.update(u, l.RGB_SPEED, e.length);
}
function V() {
  const u = ve();
  if (u.length === 0)
    return { r: 0.15, g: 0.15, b: 0.15 };
  if (u.length === 1)
    return u[0];
  const { index: e, nextIndex: t, t: r } = me.getInterpolation(u.length), o = $e(u[e], u[t], r), i = 0.95 + Math.random() * 0.1;
  return {
    r: o.r * i,
    g: o.g * i,
    b: o.b * i
  };
}
const le = 1 / 1e3, je = 5;
class qe {
  canvas;
  webgl;
  gl;
  programs;
  framebuffers;
  bloomFramebuffers;
  bloomPrograms;
  displayBloomProgram;
  splatStack = [];
  constructor(e) {
    this.canvas = e, this.webgl = new Re(e), this.gl = this.webgl.gl, this.initPrograms(), this.initFramebuffers();
  }
  initPrograms() {
    const { webgl: e } = this;
    this.programs = {
      clear: e.createProgram(R, Ce),
      display: e.createProgram(R, Ue),
      splat: e.createProgram(R, _e),
      advection: e.createProgram(R, we),
      divergence: e.createProgram(R, Ie),
      curl: e.createProgram(R, ke),
      vorticity: e.createProgram(R, Be),
      pressure: e.createProgram(R, Oe),
      gradientSubtract: e.createProgram(R, Le)
    }, this.bloomPrograms = {
      prefilter: e.createProgram(R, Me),
      blur: e.createProgram(R, Fe),
      final: e.createProgram(R, Ae)
    }, this.displayBloomProgram = e.createProgram(
      R,
      Pe
    );
  }
  initFramebuffers() {
    const { gl: e, webgl: t } = this, r = this.getResolution(l.SIM_RESOLUTION), o = this.getResolution(l.DYE_RESOLUTION), i = this.getResolution(256), n = t.extHalfFloat ? t.extHalfFloat.HALF_FLOAT_OES : e.UNSIGNED_BYTE, a = t.getSupportedFormat(e.RGBA, e.RGBA, n) || {
      internalFormat: e.RGBA,
      format: e.RGBA,
      type: e.UNSIGNED_BYTE
    }, c = t.extHalfFloatLinear || t.extFloatLinear ? e.LINEAR : e.NEAREST;
    this.framebuffers = {
      dye: t.createDoubleFBO(
        o.width,
        o.height,
        a.internalFormat,
        a.format,
        a.type,
        c
      ),
      velocity: t.createDoubleFBO(
        r.width,
        r.height,
        a.internalFormat,
        a.format,
        a.type,
        c
      ),
      divergence: t.createFBO(
        r.width,
        r.height,
        a.internalFormat,
        a.format,
        a.type,
        e.NEAREST
      ),
      curl: t.createFBO(
        r.width,
        r.height,
        a.internalFormat,
        a.format,
        a.type,
        e.NEAREST
      ),
      pressure: t.createDoubleFBO(
        r.width,
        r.height,
        a.internalFormat,
        a.format,
        a.type,
        e.NEAREST
      )
    }, this.bloomFramebuffers = {
      prefilter: t.createFBO(
        i.width,
        i.height,
        a.internalFormat,
        a.format,
        a.type,
        c
      ),
      blur: []
    };
    let s = i.width, d = i.height;
    for (let p = 0; p < je && (s = Math.floor(s / 2), d = Math.floor(d / 2), !(s < 2 || d < 2)); p++)
      this.bloomFramebuffers.blur.push(
        t.createDoubleFBO(s, d, a.internalFormat, a.format, a.type, c)
      );
  }
  getResolution(e) {
    const { gl: t } = this;
    let r = t.drawingBufferWidth / t.drawingBufferHeight;
    r < 1 && (r = 1 / r);
    const o = Math.round(e), i = Math.round(e * r);
    return t.drawingBufferWidth > t.drawingBufferHeight ? { width: i, height: o } : { width: o, height: i };
  }
  resize() {
    const e = window.innerWidth, t = window.innerHeight;
    (this.canvas.width !== e || this.canvas.height !== t) && (this.canvas.width = e, this.canvas.height = t, this.initFramebuffers());
  }
  /**
   * Apply a color splat at the given position with velocity.
   * @param x - Normalized x position [0-1]
   * @param y - Normalized y position [0-1]
   * @param dx - X velocity component
   * @param dy - Y velocity component
   * @param color - RGB color to splat
   */
  splat(e, t, r, o, i) {
    const { gl: n, webgl: a, programs: c, framebuffers: s, canvas: d } = this, { splat: p } = c, { velocity: m, dye: v } = s, T = r * le, y = o * le;
    n.useProgram(p.program), n.uniform1i(p.uniforms.uTarget, m.read.attach(0)), n.uniform1f(p.uniforms.aspectRatio, d.width / d.height), n.uniform2f(p.uniforms.point, e, t), n.uniform3f(p.uniforms.color, T, y, 0), n.uniform1f(p.uniforms.radius, this.correctRadius(l.SPLAT_RADIUS / 100)), a.blit(m.write), m.swap(), n.uniform1i(p.uniforms.uTarget, v.read.attach(0)), n.uniform3f(p.uniforms.color, i.r, i.g, i.b), a.blit(v.write), v.swap();
  }
  correctRadius(e) {
    const t = this.canvas.width / this.canvas.height;
    return t > 1 && (e *= t), e;
  }
  /**
   * Add random splats to the simulation.
   * @param amount - Number of splats to add
   */
  addSplats(e) {
    const t = [];
    for (let r = 0; r < e; r++) {
      const o = N(), i = Math.random(), n = Math.random(), a = l.AUTO_SPLAT_FORCE, c = a * 2 * (Math.random() - 0.5), s = a * 2 * (Math.random() - 0.5);
      t.push({ x: i, y: n, dx: c, dy: s, color: o });
    }
    this.splatStack.push(t);
  }
  /**
   * Advance the fluid simulation by one time step.
   * @param dt - Delta time in seconds
   */
  step(e) {
    const { gl: t, webgl: r, programs: o, framebuffers: i } = this, { velocity: n, dye: a, divergence: c, curl: s, pressure: d } = i;
    t.disable(t.BLEND), r.prepareRender(), t.useProgram(o.curl.program), t.uniform2f(o.curl.uniforms.texelSize, n.texelSizeX, n.texelSizeY), t.uniform1i(o.curl.uniforms.uVelocity, n.read.attach(0)), r.blit(s), t.useProgram(o.vorticity.program), t.uniform2f(o.vorticity.uniforms.texelSize, n.texelSizeX, n.texelSizeY), t.uniform1i(o.vorticity.uniforms.uVelocity, n.read.attach(0)), t.uniform1i(o.vorticity.uniforms.uCurl, s.attach(1)), t.uniform1f(o.vorticity.uniforms.curl, l.CURL), t.uniform1f(o.vorticity.uniforms.dt, e), t.uniform1f(o.vorticity.uniforms.damping, l.VELOCITY_DAMPING), r.blit(n.write), n.swap(), t.useProgram(o.divergence.program), t.uniform2f(o.divergence.uniforms.texelSize, n.texelSizeX, n.texelSizeY), t.uniform1i(o.divergence.uniforms.uVelocity, n.read.attach(0)), r.blit(c), t.useProgram(o.clear.program), t.uniform1i(o.clear.uniforms.uTexture, d.read.attach(0)), t.uniform1f(o.clear.uniforms.value, 0.8), r.blit(d.write), d.swap(), t.useProgram(o.pressure.program), t.uniform2f(o.pressure.uniforms.texelSize, n.texelSizeX, n.texelSizeY), t.uniform1i(o.pressure.uniforms.uDivergence, c.attach(0));
    for (let p = 0; p < l.PRESSURE_ITERATIONS; p++)
      t.uniform1i(o.pressure.uniforms.uPressure, d.read.attach(1)), r.blit(d.write), d.swap();
    t.useProgram(o.gradientSubtract.program), t.uniform2f(o.gradientSubtract.uniforms.texelSize, n.texelSizeX, n.texelSizeY), t.uniform1i(o.gradientSubtract.uniforms.uPressure, d.read.attach(0)), t.uniform1i(o.gradientSubtract.uniforms.uVelocity, n.read.attach(1)), r.blit(n.write), n.swap(), t.useProgram(o.advection.program), t.uniform2f(o.advection.uniforms.texelSize, n.texelSizeX, n.texelSizeY), t.uniform1i(o.advection.uniforms.uVelocity, n.read.attach(0)), t.uniform1i(o.advection.uniforms.uSource, n.read.attach(0)), t.uniform1f(o.advection.uniforms.dt, e), t.uniform1f(o.advection.uniforms.dissipation, l.VELOCITY_DISSIPATION), r.blit(n.write), n.swap(), t.uniform2f(o.advection.uniforms.texelSize, a.texelSizeX, a.texelSizeY), t.uniform1i(o.advection.uniforms.uVelocity, n.read.attach(0)), t.uniform1i(o.advection.uniforms.uSource, a.read.attach(1)), t.uniform1f(o.advection.uniforms.dissipation, l.DENSITY_DISSIPATION), r.blit(a.write), a.swap();
  }
  /** Render the current simulation state to the canvas. */
  render() {
    const { gl: e, webgl: t, programs: r, framebuffers: o } = this, i = l.BLOOM && this.bloomFramebuffers.blur.length > 0;
    if (t.prepareRender(), !i) {
      e.useProgram(r.display.program), e.uniform1i(r.display.uniforms.uTexture, o.dye.read.attach(0)), t.blit(null);
      return;
    }
    this.applyBloom(o.dye.read);
    const n = this.bloomFramebuffers.blur[this.bloomFramebuffers.blur.length - 1].read;
    e.useProgram(this.displayBloomProgram.program), e.uniform1i(this.displayBloomProgram.uniforms.uTexture, o.dye.read.attach(0)), e.uniform1i(this.displayBloomProgram.uniforms.uBloom, n.attach(1)), e.uniform1f(this.displayBloomProgram.uniforms.bloomIntensity, l.BLOOM_INTENSITY), t.blit(null);
  }
  applyBloom(e) {
    const { gl: t, webgl: r, bloomPrograms: o, bloomFramebuffers: i } = this, n = i.blur;
    if (n.length === 0) return;
    const a = Math.max(l.BLOOM_THRESHOLD, 1e-3), c = Math.max(a * 0.7, 1e-4);
    t.useProgram(o.prefilter.program), t.uniform3f(o.prefilter.uniforms.curve, a - c, c * 2, 0.25 / c), t.uniform1f(o.prefilter.uniforms.threshold, l.BLOOM_THRESHOLD), t.uniform1i(o.prefilter.uniforms.uTexture, e.attach(0)), r.blit(i.prefilter), t.useProgram(o.blur.program);
    let s = i.prefilter;
    for (let d = 0; d < n.length; d++) {
      const p = n[d];
      t.uniform2f(o.blur.uniforms.texelSize, 1 / s.width, 1 / s.height), t.uniform2f(o.blur.uniforms.direction, 1, 0), t.uniform1i(o.blur.uniforms.uTexture, s.attach(0)), r.blit(p.write), p.swap(), t.uniform2f(o.blur.uniforms.texelSize, 1 / p.width, 1 / p.height), t.uniform2f(o.blur.uniforms.direction, 0, 1), t.uniform1i(o.blur.uniforms.uTexture, p.read.attach(0)), r.blit(p.write), p.swap(), s = p.read;
    }
  }
  processSplatStack() {
    if (this.splatStack.length > 0) {
      const e = this.splatStack.pop();
      if (e)
        for (const t of e)
          this.splat(t.x, t.y, t.dx, t.dy, t.color);
    }
  }
  clearFramebuffers() {
    const { gl: e, framebuffers: t } = this;
    e.bindFramebuffer(e.FRAMEBUFFER, t.velocity.read.fbo), e.viewport(0, 0, t.velocity.width, t.velocity.height), e.clearColor(0, 0, 0, 1), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.FRAMEBUFFER, t.velocity.write.fbo), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.FRAMEBUFFER, t.dye.read.fbo), e.viewport(0, 0, t.dye.width, t.dye.height), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.FRAMEBUFFER, t.dye.write.fbo), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.FRAMEBUFFER, t.pressure.read.fbo), e.viewport(0, 0, t.pressure.width, t.pressure.height), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.FRAMEBUFFER, t.pressure.write.fbo), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.FRAMEBUFFER, t.divergence.fbo), e.viewport(0, 0, t.divergence.width, t.divergence.height), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.FRAMEBUFFER, t.curl.fbo), e.viewport(0, 0, t.curl.width, t.curl.height), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.FRAMEBUFFER, null), this.splatStack = [];
  }
  /** Reset the simulation, clearing all framebuffers and adding initial splats. */
  reset() {
    this.clearFramebuffers(), this.addSplats(Math.floor(Math.random() * 10) + 5);
  }
  /** Clean up all WebGL resources. Call when destroying the simulation. */
  dispose() {
    const { gl: e } = this, t = [
      ...Object.values(this.programs),
      ...Object.values(this.bloomPrograms),
      this.displayBloomProgram
    ];
    for (const i of t)
      e.deleteProgram(i.program);
    const r = (i) => {
      e.deleteTexture(i.texture), e.deleteFramebuffer(i.fbo);
    }, o = (i) => {
      r(i.read), r(i.write);
    };
    o(this.framebuffers.dye), o(this.framebuffers.velocity), o(this.framebuffers.pressure), r(this.framebuffers.divergence), r(this.framebuffers.curl), r(this.bloomFramebuffers.prefilter);
    for (const i of this.bloomFramebuffers.blur)
      o(i);
    this.webgl.dispose();
  }
}
const Ke = [60, 75, 90, 120, 144, 165, 240];
function re() {
  return new Promise((u) => {
    let e = performance.now(), t = 0;
    const r = [], o = (i) => {
      const n = i - e;
      if (e = i, t > 0 && r.push(1e3 / n), t++, t < 20)
        requestAnimationFrame(o);
      else {
        const a = r.reduce((s, d) => s + d, 0) / r.length, c = Ke.reduce(
          (s, d) => Math.abs(d - a) < Math.abs(s - a) ? d : s
        );
        u(c);
      }
    };
    requestAnimationFrame(o);
  });
}
class E {
  simulation;
  inputHandler;
  running = !1;
  frameCount = 0;
  lastFpsUpdate = Date.now();
  lastTime = Date.now();
  lastFrameTime = Date.now();
  accumulator = 0;
  monitorRefreshRate = 60;
  animationId = null;
  autoSplatInterval = null;
  onFrame;
  messageChannel = null;
  pendingMessage = !1;
  static FIXED_DT = 1 / 60;
  static MAX_FRAME_TIME = 0.1;
  static AUTO_SPLAT_INTERVAL = 2e3;
  static AUTO_SPLAT_CHANCE = 0.3;
  static FPS_UPDATE_INTERVAL = 500;
  static DEFAULT_REFRESH_RATE = 60;
  static TURBULENCE_PROBABILITY_FACTOR = 0.3;
  static TURBULENCE_FORCE_MULTIPLIER = 200;
  static TURBULENCE_COLOR_FACTOR = 0.3;
  static MARBLING_PROBABILITY = 0.1;
  static MARBLING_MAX_SWIRLS = 3;
  static MARBLING_BASE_FORCE = 150;
  static MARBLING_FORCE_VARIANCE = 100;
  refreshRateReady = !1;
  pendingStart = !1;
  constructor(e) {
    this.simulation = e.simulation, this.inputHandler = e.inputHandler ?? null, this.onFrame = e.onFrame, this.initRefreshRate();
  }
  initRefreshRate() {
    re().then((e) => this.onRefreshRateDetected(e)).catch(() => this.onRefreshRateDetected(E.DEFAULT_REFRESH_RATE));
  }
  onRefreshRateDetected(e) {
    this.monitorRefreshRate = e, this.refreshRateReady = !0, this.pendingStart && (this.pendingStart = !1, this.startInternal());
  }
  start() {
    if (!this.running) {
      if (!this.refreshRateReady) {
        this.pendingStart = !0;
        return;
      }
      this.startInternal();
    }
  }
  startInternal() {
    this.running = !0, this.lastTime = Date.now(), this.lastFrameTime = Date.now(), this.lastFpsUpdate = Date.now(), this.frameCount = 0, this.accumulator = 0, this.simulation.addSplats(Math.floor(Math.random() * 10) + 5), this.autoSplatInterval = setInterval(() => {
      l.AUTO_SPLATS && !l.PAUSED && Math.random() < E.AUTO_SPLAT_CHANCE && this.simulation.addSplats(Math.floor(Math.random() * 3) + 1);
    }, E.AUTO_SPLAT_INTERVAL), this.scheduleNextFrame();
  }
  stop() {
    this.running = !1, this.animationId !== null && (cancelAnimationFrame(this.animationId), this.animationId = null), this.autoSplatInterval !== null && (clearInterval(this.autoSplatInterval), this.autoSplatInterval = null), this.messageChannel !== null && (this.messageChannel.port1.close(), this.messageChannel.port2.close(), this.messageChannel = null, this.pendingMessage = !1);
  }
  isRunning() {
    return this.running;
  }
  scheduleNextFrame() {
    if (!this.running) return;
    const e = l.TARGET_FPS === 0, t = l.TARGET_FPS > this.monitorRefreshRate, r = e || t;
    this.inputHandler?.setImmediateMode(e), r ? (this.messageChannel || (this.messageChannel = new MessageChannel(), this.messageChannel.port1.onmessage = () => {
      this.pendingMessage = !1, this.update();
    }), this.pendingMessage || (this.pendingMessage = !0, this.messageChannel.port2.postMessage(null))) : (this.messageChannel !== null && (this.messageChannel.port1.close(), this.messageChannel.port2.close(), this.messageChannel = null, this.pendingMessage = !1), this.animationId = requestAnimationFrame(() => this.update()));
  }
  update() {
    if (!this.running) return;
    const e = Date.now();
    if (l.TARGET_FPS > 0) {
      const r = 1e3 / l.TARGET_FPS, o = e - this.lastFrameTime;
      if (o < r) {
        this.scheduleNextFrame();
        return;
      }
      this.lastFrameTime = e - o % r;
    } else
      this.lastFrameTime = e;
    this.simulation.resize();
    const t = Math.min((e - this.lastTime) / 1e3, E.MAX_FRAME_TIME);
    if (this.lastTime = e, this.accumulator += t, l.PAUSED)
      this.accumulator = 0;
    else
      for (We(t), this.simulation.processSplatStack(), this.inputHandler?.update(), this.applyTurbulence(), this.applyMarbling(); this.accumulator >= E.FIXED_DT; )
        this.simulation.step(E.FIXED_DT), this.accumulator -= E.FIXED_DT;
    this.simulation.render(), this.updateFpsCounter(e), this.scheduleNextFrame();
  }
  updateFpsCounter(e) {
    this.frameCount++;
    const t = e - this.lastFpsUpdate;
    if (t >= E.FPS_UPDATE_INTERVAL) {
      const r = Math.round(this.frameCount * 1e3 / t);
      this.onFrame?.(r), this.frameCount = 0, this.lastFpsUpdate = e;
    }
  }
  applyTurbulence() {
    if (l.TURBULENCE <= 0 || Math.random() >= l.TURBULENCE * E.TURBULENCE_PROBABILITY_FACTOR) return;
    const e = Math.random(), t = Math.random(), r = Math.random() * Math.PI * 2, o = E.TURBULENCE_FORCE_MULTIPLIER * l.TURBULENCE, i = N();
    i.r *= E.TURBULENCE_COLOR_FACTOR, i.g *= E.TURBULENCE_COLOR_FACTOR, i.b *= E.TURBULENCE_COLOR_FACTOR, this.simulation.splat(e, t, Math.cos(r) * o, Math.sin(r) * o, i);
  }
  applyMarbling() {
    if (!l.MARBLING || Math.random() >= E.MARBLING_PROBABILITY) return;
    const e = l.MARBLING_INTENSITY, t = Math.floor(Math.random() * E.MARBLING_MAX_SWIRLS) + 1;
    for (let r = 0; r < t; r++) {
      const o = Math.random(), i = Math.random(), n = Math.random() * Math.PI * 2, a = (E.MARBLING_BASE_FORCE + Math.random() * E.MARBLING_FORCE_VARIANCE) * e;
      this.simulation.splat(o, i, Math.cos(n) * a, Math.sin(n) * a, { r: 0, g: 0, b: 0 });
    }
  }
}
class Je {
  id = -1;
  texcoordX = 0;
  texcoordY = 0;
  prevTexcoordX = 0;
  prevTexcoordY = 0;
  deltaX = 0;
  deltaY = 0;
  accumulatedDeltaX = 0;
  accumulatedDeltaY = 0;
  startTexcoordX = 0;
  startTexcoordY = 0;
  down = !1;
  moved = !1;
  color = { r: 0, g: 0, b: 0 };
  _deltaResult = { dx: 0, dy: 0, startX: 0, startY: 0, endX: 0, endY: 0 };
  updateDownData(e, t, r, o) {
    this.texcoordX = e / r, this.texcoordY = 1 - t / o, this.prevTexcoordX = this.texcoordX, this.prevTexcoordY = this.texcoordY, this.startTexcoordX = this.texcoordX, this.startTexcoordY = this.texcoordY, this.deltaX = 0, this.deltaY = 0, this.accumulatedDeltaX = 0, this.accumulatedDeltaY = 0;
  }
  updateMoveData(e, t, r, o) {
    this.prevTexcoordX = this.texcoordX, this.prevTexcoordY = this.texcoordY, this.moved || (this.startTexcoordX = this.texcoordX, this.startTexcoordY = this.texcoordY), this.texcoordX = e / r, this.texcoordY = 1 - t / o;
    const i = r / o;
    let n = this.texcoordX - this.prevTexcoordX, a = this.texcoordY - this.prevTexcoordY;
    i > 1 && (n *= i), i < 1 && (a *= 1 / i), this.deltaX = n, this.deltaY = a, this.accumulatedDeltaX += n, this.accumulatedDeltaY += a, this.moved = !0;
  }
  consumeAccumulatedDelta() {
    return this._deltaResult.dx = this.accumulatedDeltaX, this._deltaResult.dy = this.accumulatedDeltaY, this._deltaResult.startX = this.startTexcoordX, this._deltaResult.startY = this.startTexcoordY, this._deltaResult.endX = this.texcoordX, this._deltaResult.endY = this.texcoordY, this.accumulatedDeltaX = 0, this.accumulatedDeltaY = 0, this.startTexcoordX = this.texcoordX, this.startTexcoordY = this.texcoordY, this.moved = !1, this._deltaResult;
  }
}
const Qe = 10, Ze = 0.01;
class et {
  canvas;
  simulation;
  pointers = [];
  /** When true, splats are applied immediately on input events for lowest latency */
  immediateMode = !1;
  boundHandlers;
  constructor(e, t) {
    this.canvas = e, this.simulation = t;
    for (let r = 0; r < Qe; r++)
      this.pointers.push(new Je());
    this.boundHandlers = {
      mouseDown: this.handleMouseDown.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this)
    }, this.attachListeners();
  }
  /** Enable/disable immediate mode for low-latency input processing */
  setImmediateMode(e) {
    this.immediateMode = e;
  }
  attachListeners() {
    const { canvas: e, boundHandlers: t } = this;
    e.addEventListener("mousedown", t.mouseDown), e.addEventListener("mousemove", t.mouseMove), window.addEventListener("mouseup", t.mouseUp), e.addEventListener("touchstart", t.touchStart, { passive: !1 }), e.addEventListener("touchmove", t.touchMove, { passive: !1 }), window.addEventListener("touchend", t.touchEnd);
  }
  /** Remove all event listeners and cleanup resources */
  dispose() {
    const { canvas: e, boundHandlers: t } = this;
    e.removeEventListener("mousedown", t.mouseDown), e.removeEventListener("mousemove", t.mouseMove), window.removeEventListener("mouseup", t.mouseUp), e.removeEventListener("touchstart", t.touchStart), e.removeEventListener("touchmove", t.touchMove), window.removeEventListener("touchend", t.touchEnd);
  }
  handleMouseDown(e) {
    const t = this.pointers[0];
    t.down = !0, t.color = l.RGB_MODE ? V() : N(), t.updateDownData(e.offsetX, e.offsetY, this.canvas.width, this.canvas.height);
  }
  handleMouseMove(e) {
    const t = this.pointers[0];
    t.down && (l.RGB_MODE && (t.color = V()), t.updateMoveData(e.offsetX, e.offsetY, this.canvas.width, this.canvas.height), this.immediateMode && this.processPointerSplat(t));
  }
  handleMouseUp() {
    this.pointers[0].down = !1;
  }
  handleTouchStart(e) {
    e.preventDefault();
    const t = e.targetTouches;
    for (let r = 0; r < t.length; r++) {
      const o = t[r], i = this.findPointerById(o.identifier) ?? this.findFreePointer();
      i && (i.id = o.identifier, i.down = !0, i.color = l.RGB_MODE ? V() : N(), i.updateDownData(o.clientX, o.clientY, this.canvas.width, this.canvas.height));
    }
  }
  handleTouchMove(e) {
    e.preventDefault();
    const t = e.targetTouches;
    for (let r = 0; r < t.length; r++) {
      const o = t[r], i = this.findPointerById(o.identifier);
      i?.down && (l.RGB_MODE && (i.color = V()), i.updateMoveData(o.clientX, o.clientY, this.canvas.width, this.canvas.height), this.immediateMode && this.processPointerSplat(i));
    }
  }
  handleTouchEnd(e) {
    const t = e.changedTouches;
    for (let r = 0; r < t.length; r++) {
      const o = this.findPointerById(t[r].identifier);
      o && (o.down = !1, o.id = -1);
    }
  }
  findPointerById(e) {
    return this.pointers.find((t) => t.id === e);
  }
  findFreePointer() {
    return this.pointers.find((e) => e.id === -1);
  }
  /** Process a single pointer's accumulated movement into splats */
  processPointerSplat(e) {
    if (!e.moved) return;
    const { dx: t, dy: r, startX: o, startY: i, endX: n, endY: a } = e.consumeAccumulatedDelta(), c = n - o, s = a - i, d = Math.sqrt(c * c + s * s), p = Math.max(1, Math.floor(d / Ze)), m = l.SPLAT_FORCE / p;
    for (let v = 0; v < p; v++) {
      const T = p === 1 ? 1 : v / (p - 1), y = o + c * T, S = i + s * T;
      this.simulation.splat(
        y,
        S,
        t * m,
        r * m,
        e.color
      );
    }
  }
  update() {
    if (!this.immediateMode)
      for (const e of this.pointers)
        this.processPointerSplat(e);
  }
}
class tt {
  simulation;
  gui;
  canvas;
  shortcuts = /* @__PURE__ */ new Map();
  boundHandler;
  constructor(e, t, r) {
    this.simulation = e, this.gui = t, this.canvas = r, this.registerShortcuts(), this.boundHandler = this.handleKeyDown.bind(this), window.addEventListener("keydown", this.boundHandler);
  }
  registerShortcuts() {
    const e = Object.keys(D);
    this.addShortcut(" ", "Random splats", () => {
      this.simulation.addSplats(Math.floor(Math.random() * 8) + 5);
    }), this.addShortcut("r", "Reset simulation", () => {
      this.simulation.reset();
    }), this.addShortcut("p", "Toggle pause", () => {
      g("PAUSED", !l.PAUSED);
    }), this.addShortcut("b", "Toggle bloom", () => {
      g("BLOOM", !l.BLOOM), this.gui.updateCheckbox("bloom", l.BLOOM);
    }), this.addShortcut("m", "Toggle marbling", () => {
      g("MARBLING", !l.MARBLING), this.gui.updateCheckbox("marbling", l.MARBLING);
    }), this.addShortcut("h", "Toggle UI", () => {
      g("SHOW_UI", !l.SHOW_UI);
      const t = document.getElementById("gui"), r = document.querySelector(".info");
      t && (t.style.display = l.SHOW_UI ? "" : "none"), r && (r.style.display = l.SHOW_UI ? "" : "none");
    }), this.addShortcut("s", "Screenshot", () => {
      const t = document.createElement("a");
      t.download = `fluid-${Date.now()}.png`, t.href = this.canvas.toDataURL("image/png"), t.click();
    });
    for (let t = 0; t <= 9; t++) {
      const r = t.toString(), o = t === 0 ? 9 : t - 1;
      o < e.length && this.addShortcut(r, `Palette: ${e[o]}`, () => {
        g("COLOR_PALETTE", e[o]), this.gui.updateSelect("color-palette", e[o]);
      });
    }
  }
  addShortcut(e, t, r) {
    this.shortcuts.set(e.toLowerCase(), { key: e, description: t, action: r });
  }
  handleKeyDown(e) {
    const t = e.target;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      return;
    const r = e.key.toLowerCase(), o = this.shortcuts.get(r);
    o && (r === " " && e.preventDefault(), o.action());
  }
  /** Remove event listener and cleanup */
  dispose() {
    window.removeEventListener("keydown", this.boundHandler), this.shortcuts.clear();
  }
  getShortcutList() {
    return Array.from(this.shortcuts.values()).map(({ key: e, description: t }) => ({
      key: e === " " ? "Space" : e.toUpperCase(),
      description: t
    }));
  }
  destroy() {
    window.removeEventListener("keydown", this.boundHandler);
  }
}
function ot(u, e, t, r) {
  const o = document.createElement("div");
  o.className = "color-picker-wrapper";
  let i = Z(u), n = u;
  const a = document.createElement("div");
  a.className = "color-picker-trigger";
  const c = document.createElement("div");
  c.className = "color-picker-swatch", c.style.backgroundColor = n, a.appendChild(c);
  const s = document.createElement("div");
  s.className = "color-picker-panel";
  const d = document.createElement("div");
  d.className = "color-picker-saturation";
  const p = document.createElement("div");
  p.className = "color-picker-saturation-bg", p.style.backgroundColor = z({ h: i.h, s: 1, v: 1 });
  const m = document.createElement("div");
  m.className = "color-picker-saturation-white";
  const v = document.createElement("div");
  v.className = "color-picker-saturation-black";
  const T = document.createElement("div");
  T.className = "color-picker-saturation-handle", T.style.left = `${i.s * 100}%`, T.style.top = `${(1 - i.v) * 100}%`, T.style.backgroundColor = n, d.appendChild(p), d.appendChild(m), d.appendChild(v), d.appendChild(T);
  const y = document.createElement("div");
  y.className = "color-picker-hue";
  const S = document.createElement("div");
  S.className = "color-picker-hue-handle", S.style.left = `${i.h / 360 * 100}%`, S.style.backgroundColor = z({ h: i.h, s: 1, v: 1 }), y.appendChild(S);
  const I = document.createElement("div");
  I.className = "color-picker-format-tabs";
  let M = "hex";
  const ne = ["hex", "rgb", "hsl"], ae = {};
  ne.forEach((f) => {
    const h = document.createElement("button");
    h.type = "button", h.className = "color-picker-format-tab", h.textContent = f.toUpperCase(), f === M && h.classList.add("active"), h.addEventListener("click", (x) => {
      x.stopPropagation(), M = f, ne.forEach((b) => ae[b].classList.toggle("active", b === f)), Te();
    }), ae[f] = h, I.appendChild(h);
  });
  const _ = document.createElement("div");
  _.className = "color-picker-input-row color-picker-format-hex";
  const W = document.createElement("span");
  W.className = "color-picker-input-label", W.textContent = "HEX";
  const w = document.createElement("input");
  w.type = "text", w.className = "color-picker-hex-input", w.value = n.toUpperCase(), w.maxLength = 7;
  const H = document.createElement("div");
  H.className = "color-picker-preview", H.style.backgroundColor = n, _.appendChild(W), _.appendChild(w), _.appendChild(H);
  const U = document.createElement("div");
  U.className = "color-picker-input-row color-picker-format-rgb", U.style.display = "none";
  const C = {}, Ee = oe(n);
  ["r", "g", "b"].forEach((f) => {
    const h = document.createElement("div");
    h.className = "color-picker-input-group";
    const x = document.createElement("span");
    x.className = "color-picker-input-label", x.textContent = f.toUpperCase();
    const b = document.createElement("input");
    b.type = "number", b.className = "color-picker-number-input", b.min = "0", b.max = "255", b.value = String(Ee[f]), C[f] = b, h.appendChild(x), h.appendChild(b), U.appendChild(h);
  });
  const P = document.createElement("div");
  P.className = "color-picker-input-row color-picker-format-hsl", P.style.display = "none";
  const k = {}, j = se(i);
  [
    { key: "h", label: "H", min: 0, max: 360, value: Math.round(j.h) },
    { key: "s", label: "S", min: 0, max: 100, value: Math.round(j.s) },
    { key: "l", label: "L", min: 0, max: 100, value: Math.round(j.l) }
  ].forEach(({ key: f, label: h, min: x, max: b, value: Se }) => {
    const X = document.createElement("div");
    X.className = "color-picker-input-group";
    const J = document.createElement("span");
    J.className = "color-picker-input-label", J.textContent = h;
    const O = document.createElement("input");
    O.type = "number", O.className = "color-picker-number-input", O.min = String(x), O.max = String(b), O.value = String(Se), k[f] = O, X.appendChild(J), X.appendChild(O), P.appendChild(X);
  });
  const Te = () => {
    _.style.display = M === "hex" ? "flex" : "none", U.style.display = M === "rgb" ? "flex" : "none", P.style.display = M === "hsl" ? "flex" : "none";
  };
  s.appendChild(d), s.appendChild(y), s.appendChild(I), s.appendChild(_), s.appendChild(U), s.appendChild(P), o.appendChild(a), o.appendChild(s);
  const B = (f = !0) => {
    n = z(i);
    const h = z({ h: i.h, s: 1, v: 1 });
    c.style.backgroundColor = n, p.style.backgroundColor = h, T.style.left = `${i.s * 100}%`, T.style.top = `${(1 - i.v) * 100}%`, T.style.backgroundColor = n, S.style.left = `${i.h / 360 * 100}%`, S.style.backgroundColor = h, w.value = n.toUpperCase(), H.style.backgroundColor = n;
    const x = oe(n);
    C.r.value = String(x.r), C.g.value = String(x.g), C.b.value = String(x.b);
    const b = se(i);
    k.h.value = String(Math.round(b.h)), k.s.value = String(Math.round(b.s)), k.l.value = String(Math.round(b.l)), f && e(n);
  };
  B(!1);
  let F = !1;
  const Y = (f) => {
    const h = d.getBoundingClientRect(), x = "touches" in f ? f.touches[0].clientX : f.clientX, b = "touches" in f ? f.touches[0].clientY : f.clientY;
    i.s = Math.max(0, Math.min(1, (x - h.left) / h.width)), i.v = Math.max(0, Math.min(1, 1 - (b - h.top) / h.height)), B();
  };
  d.addEventListener("mousedown", (f) => {
    f.preventDefault(), f.stopPropagation(), F = !0, Y(f);
  }), d.addEventListener(
    "touchstart",
    (f) => {
      f.preventDefault(), f.stopPropagation(), F = !0, Y(f);
    },
    { passive: !1 }
  );
  let A = !1;
  const G = (f) => {
    const h = y.getBoundingClientRect(), x = "touches" in f ? f.touches[0].clientX : f.clientX;
    i.h = Math.max(0, Math.min(360, (x - h.left) / h.width * 360)), B();
  };
  y.addEventListener("mousedown", (f) => {
    f.preventDefault(), f.stopPropagation(), A = !0, G(f);
  }), y.addEventListener(
    "touchstart",
    (f) => {
      f.preventDefault(), f.stopPropagation(), A = !0, G(f);
    },
    { passive: !1 }
  ), document.addEventListener("mousemove", (f) => {
    F && Y(f), A && G(f);
  }), document.addEventListener(
    "touchmove",
    (f) => {
      F && Y(f), A && G(f);
    },
    { passive: !1 }
  ), document.addEventListener("mouseup", () => {
    F = !1, A = !1;
  }), document.addEventListener("touchend", () => {
    F = !1, A = !1;
  }), w.addEventListener("input", () => {
    let f = w.value.trim();
    f.startsWith("#") || (f = "#" + f), /^#[0-9A-Fa-f]{6}$/.test(f) && (i = Z(f), B());
  }), w.addEventListener("blur", () => {
    w.value = n.toUpperCase();
  });
  const q = () => {
    const f = Math.max(0, Math.min(255, parseInt(C.r.value) || 0)), h = Math.max(0, Math.min(255, parseInt(C.g.value) || 0)), x = Math.max(0, Math.min(255, parseInt(C.b.value) || 0)), b = he(f, h, x);
    i = Z(b), B();
  };
  C.r.addEventListener("input", q), C.g.addEventListener("input", q), C.b.addEventListener("input", q);
  const K = () => {
    const f = Math.max(0, Math.min(360, parseInt(k.h.value) || 0)), h = Math.max(0, Math.min(100, parseInt(k.s.value) || 0)), x = Math.max(0, Math.min(100, parseInt(k.l.value) || 0));
    i = Xe({ h: f, s: h, l: x }), B();
  };
  return k.h.addEventListener("input", K), k.s.addEventListener("input", K), k.l.addEventListener("input", K), a.addEventListener("click", (f) => {
    f.stopPropagation();
    const h = t();
    h && h !== o && h.classList.remove("open"), o.classList.toggle("open"), r(o.classList.contains("open") ? o : null);
  }), s.addEventListener("click", (f) => f.stopPropagation()), o;
}
function rt(u, e, t, r, o) {
  const i = document.createElement("div");
  i.className = "custom-dropdown";
  const a = u.find((d) => d.value === e)?.label || u[0]?.label || "", c = document.createElement("button");
  c.type = "button", c.className = "custom-dropdown-trigger", c.textContent = a;
  const s = document.createElement("div");
  return s.className = "custom-dropdown-menu", u.forEach((d) => {
    const p = document.createElement("div");
    p.className = "custom-dropdown-option", d.value === e && p.classList.add("selected"), p.textContent = d.label, p.dataset.value = d.value, p.addEventListener("click", (m) => {
      m.stopPropagation(), s.querySelectorAll(".custom-dropdown-option").forEach((v) => {
        v.classList.remove("selected");
      }), p.classList.add("selected"), c.textContent = d.label, i.classList.remove("open"), o(null), t(d.value);
    }), s.appendChild(p);
  }), c.addEventListener("click", (d) => {
    d.stopPropagation();
    const p = r();
    p && p !== i && p.classList.remove("open"), i.classList.toggle("open"), o(i.classList.contains("open") ? i : null);
  }), i.appendChild(c), i.appendChild(s), i;
}
const ce = [
  { id: "sim-resolution", key: "SIM_RESOLUTION", reinitFBO: !0 },
  { id: "dye-resolution", key: "DYE_RESOLUTION", reinitFBO: !0 },
  { id: "density-dissipation", key: "DENSITY_DISSIPATION" },
  { id: "velocity-dissipation", key: "VELOCITY_DISSIPATION" },
  { id: "velocity-damping", key: "VELOCITY_DAMPING" },
  { id: "pressure-iterations", key: "PRESSURE_ITERATIONS" },
  { id: "curl", key: "CURL" },
  { id: "splat-radius", key: "SPLAT_RADIUS" },
  { id: "splat-force", key: "SPLAT_FORCE" },
  { id: "bloom-intensity", key: "BLOOM_INTENSITY" },
  { id: "bloom-threshold", key: "BLOOM_THRESHOLD" },
  { id: "sharpness", key: "SHARPNESS" },
  { id: "vignette", key: "VIGNETTE" },
  { id: "turbulence", key: "TURBULENCE" },
  { id: "auto-splat-force", key: "AUTO_SPLAT_FORCE" },
  { id: "marbling-intensity", key: "MARBLING_INTENSITY" },
  { id: "rgb-speed", key: "RGB_SPEED" },
  { id: "color-intensity", key: "COLOR_INTENSITY" }
], de = [
  { id: "auto-splats", key: "AUTO_SPLATS" },
  { id: "bloom", key: "BLOOM" },
  { id: "marbling", key: "MARBLING" },
  { id: "rgb-mode", key: "RGB_MODE" }
];
class L {
  simulation;
  collapsed = !0;
  customPaletteContainer = null;
  activeDropdown = null;
  activeColorPicker = null;
  container = null;
  infoBar = null;
  forceHideUI = !1;
  static stylesInjected = !1;
  static injectedStyles = null;
  static injectStyles(e) {
    L.injectedStyles = e;
  }
  constructor(e, t) {
    this.simulation = e, this.forceHideUI = t?.forceHideUI ?? !1, this.ensureDOM(), this.init(), this.setupGlobalClickHandler(), this.applyInitialVisibility();
  }
  applyInitialVisibility() {
    (this.forceHideUI || !l.SHOW_UI) && (this.container && (this.container.style.display = "none"), this.infoBar && (this.infoBar.style.display = "none"), this.forceHideUI && l.SHOW_UI && (l.SHOW_UI = !1));
  }
  ensureDOM() {
    if (!L.stylesInjected && L.injectedStyles) {
      const e = document.createElement("style");
      e.id = "fluid-sim-styles", e.textContent = L.injectedStyles, document.head.appendChild(e), L.stylesInjected = !0;
    }
    document.getElementById("gui") || (this.container = document.createElement("div"), this.container.id = "gui", this.container.className = "gui", this.container.innerHTML = this.buildGUIHTML(), document.body.appendChild(this.container), this.infoBar = document.createElement("div"), this.infoBar.className = "info", this.infoBar.innerHTML = `
      <span class="info-text">Click/drag to interact · Space: splats · R: reset · P: pause · B: bloom · M: marbling · H: hide UI</span>
      <span class="fps" id="fps">60 FPS</span>
    `, document.body.appendChild(this.infoBar));
  }
  buildGUIHTML() {
    return `
      <div class="gui-header">
        <span>Settings</span>
        <button id="gui-toggle" class="gui-toggle"><i class="fa-solid fa-plus"></i></button>
      </div>
      <div id="gui-content" class="gui-content collapsed">
        ${this.buildSection("Brush", [
      this.buildSlider("splat-radius", "Radius", "Size of the color splat", 0.05, 1, 0.25, 0.05),
      this.buildSlider("splat-force", "Force", "How much force is applied", 1e3, 1e4, 6e3, 500)
    ])}
        ${this.buildSection("Automation", [
      this.buildCheckboxRow("auto-splats", "Auto Splats", "Automatically generate random splats", !0),
      this.buildSlider("auto-splat-force", "Auto Force", "Force of automatic splats", 50, 1e3, 500, 50),
      this.buildCheckboxRow("marbling", "Marbling", "Creates paint-like streaky patterns", !1),
      this.buildSlider("marbling-intensity", "Marbling Intensity", "Strength of marbling currents", 0.1, 2, 0.5, 0.1)
    ])}
        ${this.buildSection("Physics", [
      this.buildSlider("curl", "Curl", "Amplifies rotational motion", 0, 100, 30, 5),
      this.buildSlider("turbulence", "Turbulence", "Adds random chaotic motion", 0, 1, 0, 0.1),
      this.buildSlider("velocity-dissipation", "Velocity Decay", "How quickly fluid movement fades", 0.9, 1, 0.99, 0.01),
      this.buildSlider("velocity-damping", "Damping", "Resistance that increases with speed", 0, 2, 0.5, 0.1),
      this.buildSlider("density-dissipation", "Color Decay", "How quickly colors fade", 0.9, 1, 0.98, 0.01),
      this.buildSlider("pressure-iterations", "Pressure Accuracy", "Accuracy of pressure calculation", 5, 50, 20, 5)
    ])}
        ${this.buildSection("Colors", [
      '<div class="gui-group"><label data-tooltip="Select a preset color palette">Palette</label><select id="color-palette"></select></div>',
      '<div id="custom-palette-container" class="custom-palette-container" style="display: none;"><div class="gui-group-label">Custom Colors</div><div id="custom-color-list" class="custom-color-list"></div><button id="add-color-btn" class="btn btn-small">+ Add Color</button></div>',
      this.buildSlider("color-intensity", "Intensity", "Brightness/intensity of the colors", 0.05, 0.5, 0.15, 0.01),
      this.buildCheckboxRow("rgb-mode", "Color Cycling", "Continuously cycle through palette colors", !1),
      this.buildSlider("rgb-speed", "Cycle Speed", "How fast colors cycle", 0.1, 3, 1, 0.1)
    ])}
        ${this.buildSection("Effects", [
      this.buildCheckboxRow("bloom", "Bloom", "Adds a glowing effect to bright areas", !0),
      this.buildSlider("bloom-intensity", "Bloom Intensity", "Strength of the bloom glow effect", 0, 2, 0.8, 0.1),
      this.buildSlider("bloom-threshold", "Bloom Threshold", "Brightness level required for bloom", 0, 1, 0.6, 0.05),
      this.buildSlider("sharpness", "Sharpness", "Enhances edge definition", 0, 2, 0, 0.1),
      this.buildSlider("vignette", "Vignette", "Darkens the edges of the screen", 0, 1, 0.5, 0.1)
    ])}
        ${this.buildSection("Performance", [
      this.buildSlider("sim-resolution", "Sim Resolution", "Resolution of fluid physics", 64, 512, 256, 64),
      this.buildSlider("dye-resolution", "Dye Resolution", "Resolution of color rendering", 512, 2048, 1024, 256),
      this.buildSlider("target-fps", "FPS Limit", "FPS limit", 1, 60, 60, 1),
      this.buildCheckboxRow("benchmark-mode", "Benchmark Mode", "Unlock unlimited FPS", !1)
    ])}
        <div class="gui-actions">
          <button id="random-splat-btn" class="btn">Random Splat</button>
          <button id="screenshot-btn" class="btn">Screenshot</button>
          <div class="settings-dropdown">
            <button id="settings-btn" class="btn">Settings</button>
            <div id="settings-submenu" class="settings-submenu">
              ${this.forceHideUI ? "" : '<label class="settings-submenu-checkbox"><input type="checkbox" id="hide-ui-startup"> Hide UI on Startup</label>'}
              <label class="settings-submenu-checkbox"><input type="checkbox" id="auto-save-config" checked> Auto-save Settings</label>
              <div class="settings-submenu-divider"></div>
              <button id="save-settings-btn" class="settings-submenu-btn">Save</button>
              <button id="load-settings-btn" class="settings-submenu-btn">Load</button>
              <button id="clear-settings-btn" class="settings-submenu-btn">Clear</button>
              <div class="settings-submenu-divider"></div>
              <button id="reset-btn" class="settings-submenu-btn">Reset Simulation</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  buildSection(e, t) {
    return `<div class="gui-section"><div class="gui-section-title">${e}</div>${t.join("")}</div>`;
  }
  buildSlider(e, t, r, o, i, n, a) {
    return `<div class="gui-group"><label data-tooltip="${r}">${t}</label><input type="range" id="${e}" min="${o}" max="${i}" value="${n}" step="${a}"><span id="${e}-value">${n}</span></div>`;
  }
  buildCheckboxRow(e, t, r, o) {
    return `<div class="gui-group gui-row"><label data-tooltip="${r}">${t}</label><input type="checkbox" id="${e}"${o ? " checked" : ""}></div>`;
  }
  destroy() {
    this.container?.remove(), this.infoBar?.remove();
  }
  setupGlobalClickHandler() {
    document.addEventListener("click", (e) => {
      this.activeDropdown && !this.activeDropdown.contains(e.target) && (this.activeDropdown.classList.remove("open"), this.activeDropdown = null), this.activeColorPicker && !this.activeColorPicker.contains(e.target) && (this.activeColorPicker.classList.remove("open"), this.activeColorPicker = null);
    });
  }
  init() {
    const e = document.getElementById("gui-toggle"), t = document.getElementById("gui-content"), r = document.querySelector(".gui-header");
    if (r && t && e) {
      const n = e.querySelector("i");
      r.addEventListener("click", () => {
        this.collapsed = !this.collapsed, t.classList.toggle("collapsed", this.collapsed), n && (n.classList.toggle("fa-plus", this.collapsed), n.classList.toggle("fa-minus", !this.collapsed));
      }), this.collapsed && (t.classList.add("collapsed"), n && (n.classList.add("fa-plus"), n.classList.remove("fa-minus")));
    }
    for (const n of ce)
      this.bindSlider(n.id, n.key, n.reinitFBO ?? !1);
    for (const n of de)
      this.bindCheckbox(n.id, n.key);
    this.initFpsSlider(), this.initColorPaletteSelector(), this.initCustomPaletteUI();
    const o = document.getElementById("random-splat-btn");
    o && o.addEventListener("click", () => {
      this.simulation.addSplats(Math.floor(Math.random() * 5) + 3);
    });
    const i = document.getElementById("screenshot-btn");
    i && i.addEventListener("click", () => this.takeScreenshot()), this.initSettingsSubmenu(), this.refreshAllControls();
  }
  initSettingsSubmenu() {
    const e = document.getElementById("settings-btn"), t = document.getElementById("settings-submenu");
    e && t && (e.addEventListener("click", (d) => {
      d.stopPropagation(), t.classList.toggle("open");
    }), document.addEventListener("click", (d) => {
      !t.contains(d.target) && !e.contains(d.target) && t.classList.remove("open");
    }));
    const r = document.getElementById("hide-ui-startup");
    r && (r.checked = !l.SHOW_UI, r.addEventListener("change", () => {
      g("SHOW_UI", !r.checked);
    }));
    const o = document.getElementById("auto-save-config"), i = document.getElementById("save-settings-btn"), n = document.getElementById("load-settings-btn"), a = () => {
      const d = l.AUTO_SAVE;
      i && (i.style.display = d ? "none" : ""), n && (n.style.display = d ? "none" : "");
    };
    o && (o.checked = l.AUTO_SAVE, a(), o.addEventListener("change", () => {
      g("AUTO_SAVE", o.checked), o.checked && te(), a();
    })), i && i.addEventListener("click", () => {
      te(), this.showToast("Settings saved!");
    }), n && n.addEventListener("click", () => {
      ue() ? (this.refreshAllControls(), this.showToast("Settings loaded!")) : this.showToast("No saved settings found");
    });
    const c = document.getElementById("clear-settings-btn");
    c && c.addEventListener("click", () => {
      pe(), ee(), this.refreshAllControls(), this.simulation.reset(), this.showToast("Settings cleared!");
    });
    const s = document.getElementById("reset-btn");
    s && s.addEventListener("click", () => {
      ee(), this.refreshAllControls(), this.simulation.initFramebuffers(), this.simulation.reset(), this.showToast("Reset to defaults");
    });
  }
  showToast(e) {
    const t = document.querySelector(".toast");
    t && t.remove();
    const r = document.createElement("div");
    r.className = "toast", r.textContent = e, document.body.appendChild(r), setTimeout(() => r.classList.add("show"), 10), setTimeout(() => {
      r.classList.remove("show"), setTimeout(() => r.remove(), 300);
    }, 2e3);
  }
  refreshAllControls() {
    for (const { id: s, key: d } of ce) {
      const p = document.getElementById(s), m = document.getElementById(`${s}-value`);
      p && (p.value = String(l[d]), m && (m.textContent = String(l[d])));
    }
    const e = document.getElementById("target-fps"), t = document.getElementById("target-fps-value");
    e && t && (e.value = String(l.TARGET_FPS), t.textContent = l.TARGET_FPS === 0 ? "∞" : String(l.TARGET_FPS));
    for (const { id: s, key: d } of de) {
      const p = document.getElementById(s);
      p && (p.checked = l[d]);
    }
    const r = document.querySelector(".custom-dropdown-trigger");
    if (r) {
      const s = D[l.COLOR_PALETTE];
      s && (r.textContent = s.name);
    }
    this.toggleCustomPaletteVisibility(l.COLOR_PALETTE === "custom");
    const o = document.getElementById("hide-ui-startup");
    o && (o.checked = !l.SHOW_UI);
    const i = document.getElementById("auto-save-config"), n = document.getElementById("save-settings-btn"), a = document.getElementById("load-settings-btn");
    i && (i.checked = l.AUTO_SAVE);
    const c = l.AUTO_SAVE;
    n && (n.style.display = c ? "none" : ""), a && (a.style.display = c ? "none" : "");
  }
  takeScreenshot() {
    const e = this.simulation.canvas, t = document.createElement("a");
    t.download = `fluid-${Date.now()}.png`, t.href = e.toDataURL("image/png"), t.click();
  }
  initFpsSlider() {
    const e = document.getElementById("target-fps"), t = document.getElementById("target-fps-value"), r = document.getElementById("sim-resolution"), o = document.getElementById("sim-resolution-value"), i = document.getElementById("dye-resolution"), n = document.getElementById("dye-resolution-value"), a = document.getElementById("benchmark-mode");
    if (!e || !t) return;
    let c = 60;
    if (re().then((s) => {
      c = s, a?.checked || (e.max = String(s), l.TARGET_FPS > s ? (g("TARGET_FPS", s), e.value = String(s), t.textContent = String(s)) : (e.value = String(l.TARGET_FPS), t.textContent = l.TARGET_FPS === 0 ? "∞" : String(l.TARGET_FPS)));
    }), e.value = String(l.TARGET_FPS), t.textContent = l.TARGET_FPS === 0 ? "∞" : String(l.TARGET_FPS), e.addEventListener("input", () => {
      const s = Number(e.value);
      g("TARGET_FPS", s), t.textContent = s === 0 ? "∞" : String(s);
    }), a) {
      const s = {
        fps: { min: 1, max: 60 },
        sim: { max: 512 },
        dye: { max: 2048 }
      }, d = {
        fps: { min: 0, max: 240 },
        sim: { max: 1024 },
        dye: { max: 4096 }
      }, p = (m) => {
        const v = m ? d : s, T = m ? d.fps.max : c;
        e.min = String(v.fps.min), e.max = String(T);
        const y = Number(e.value), S = v.fps.min, I = T;
        y < S ? (e.value = String(S), g("TARGET_FPS", S), t.textContent = S === 0 ? "∞" : String(S)) : y > I && (e.value = String(I), g("TARGET_FPS", I), t.textContent = String(I)), r && o && (r.max = String(v.sim.max)), i && n && (i.max = String(v.dye.max));
      };
      a.addEventListener("change", () => {
        const m = a.checked;
        p(m), m ? this.showToast("Benchmark mode enabled!") : ((l.TARGET_FPS > c || l.TARGET_FPS === 0) && (e.value = String(c), g("TARGET_FPS", c), t.textContent = String(c)), r && o && l.SIM_RESOLUTION > 512 && (r.value = "512", g("SIM_RESOLUTION", 512), o.textContent = "512", this.simulation.initFramebuffers()), i && n && l.DYE_RESOLUTION > 2048 && (i.value = "2048", g("DYE_RESOLUTION", 2048), n.textContent = "2048", this.simulation.initFramebuffers()));
      }), re().then((m) => {
        s.fps.max = m;
      });
    }
  }
  initColorPaletteSelector() {
    const e = document.getElementById("color-palette");
    if (!e) return;
    e.classList.add("hidden");
    const t = [];
    for (const [o, i] of Object.entries(D))
      t.push({ value: o, label: i.name });
    const r = rt(
      t,
      l.COLOR_PALETTE,
      (o) => {
        const i = o;
        g("COLOR_PALETTE", i), this.toggleCustomPaletteVisibility(i === "custom");
      },
      () => this.activeDropdown,
      (o) => {
        this.activeDropdown = o;
      }
    );
    e.parentNode?.insertBefore(r, e.nextSibling);
  }
  initCustomPaletteUI() {
    if (this.customPaletteContainer = document.getElementById("custom-palette-container"), !this.customPaletteContainer) return;
    this.renderCustomColors();
    const e = document.getElementById("add-color-btn");
    e && e.addEventListener("click", () => this.addCustomColor()), this.toggleCustomPaletteVisibility(l.COLOR_PALETTE === "custom");
  }
  toggleCustomPaletteVisibility(e) {
    this.customPaletteContainer && (this.customPaletteContainer.style.display = e ? "block" : "none");
  }
  renderCustomColors() {
    const e = document.getElementById("custom-color-list");
    e && (e.innerHTML = "", l.CUSTOM_COLORS.forEach((t, r) => {
      const o = document.createElement("div");
      o.className = "custom-color-row";
      const i = document.createElement("input");
      i.type = "checkbox", i.checked = t.enabled, i.className = "custom-color-checkbox", i.addEventListener("change", () => {
        const c = l.CUSTOM_COLORS[r];
        this.updateCustomColor(r, { ...c, enabled: i.checked });
      });
      const n = ot(
        t.hex,
        (c) => {
          const s = l.CUSTOM_COLORS[r];
          this.updateCustomColor(r, { ...s, hex: c });
        },
        () => this.activeColorPicker,
        (c) => {
          this.activeColorPicker = c;
        }
      ), a = document.createElement("button");
      a.className = "custom-color-remove", a.textContent = "×", a.addEventListener("click", () => this.removeCustomColor(r)), o.appendChild(i), o.appendChild(n), o.appendChild(a), e.appendChild(o);
    }));
  }
  addCustomColor() {
    const e = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"), t = [...l.CUSTOM_COLORS, { hex: e, enabled: !0 }];
    g("CUSTOM_COLORS", t), this.renderCustomColors();
  }
  removeCustomColor(e) {
    if (l.CUSTOM_COLORS.length <= 1) return;
    const t = l.CUSTOM_COLORS.filter((r, o) => o !== e);
    g("CUSTOM_COLORS", t), this.renderCustomColors();
  }
  updateCustomColor(e, t) {
    const r = [...l.CUSTOM_COLORS];
    r[e] = t, g("CUSTOM_COLORS", r);
  }
  bindSlider(e, t, r = !1) {
    const o = document.getElementById(e), i = document.getElementById(`${e}-value`);
    o && i && o.addEventListener("input", (n) => {
      const a = parseFloat(n.target.value);
      g(t, a), i.textContent = String(a), r && this.simulation.initFramebuffers();
    });
  }
  bindCheckbox(e, t) {
    const r = document.getElementById(e);
    r && r.addEventListener("change", (o) => {
      g(t, o.target.checked);
    });
  }
  updateCheckbox(e, t) {
    const r = document.getElementById(e);
    r && (r.checked = t);
  }
  updateSelect(e, t) {
    const r = document.getElementById(e);
    if (r) {
      r.value = t;
      const o = r.parentNode?.querySelector(".custom-dropdown");
      if (o) {
        const i = o.querySelector(".custom-dropdown-trigger");
        o.querySelectorAll(".custom-dropdown-option").forEach((a) => {
          const c = a;
          c.dataset.value === t ? (c.classList.add("selected"), i && (i.textContent = c.textContent)) : c.classList.remove("selected");
        });
      }
    }
  }
}
const it = ':root{--color-bg-primary: rgba(15, 15, 20, .85);--color-bg-panel: rgba(20, 20, 28, .95);--color-bg-panel-solid: rgba(20, 20, 28, .98);--color-bg-input: rgba(255, 255, 255, .06);--color-bg-input-hover: rgba(255, 255, 255, .1);--color-bg-button: rgba(255, 255, 255, .08);--color-bg-button-hover: rgba(255, 255, 255, .15);--color-border-subtle: rgba(255, 255, 255, .1);--color-border-default: rgba(255, 255, 255, .12);--color-border-strong: rgba(255, 255, 255, .15);--color-border-hover: rgba(255, 255, 255, .2);--color-border-active: rgba(255, 255, 255, .25);--color-accent: rgba(100, 180, 255, 1);--color-accent-dim: rgba(100, 180, 255, .6);--color-accent-bg: rgba(100, 180, 255, .2);--color-accent-bg-hover: rgba(100, 180, 255, .15);--color-accent-border: rgba(100, 180, 255, .4);--color-danger-bg: rgba(255, 100, 100, .1);--color-danger-bg-hover: rgba(255, 100, 100, .25);--color-danger-border: rgba(255, 100, 100, .2);--color-danger-text: rgba(255, 150, 150, .8);--color-text-primary: #fff;--color-text-secondary: rgba(255, 255, 255, .7);--color-text-tertiary: rgba(255, 255, 255, .5);--color-text-muted: rgba(255, 255, 255, .6);--radius-sm: 4px;--radius-md: 6px;--radius-lg: 8px;--radius-xl: 12px;--radius-round: 50%;--blur-standard: blur(20px);--blur-panel: blur(16px);--shadow-panel: 0 8px 32px rgba(0, 0, 0, .4);--shadow-popup: 0 12px 40px rgba(0, 0, 0, .5);--shadow-button: 0 4px 20px rgba(0, 0, 0, .4);--transition-fast: .15s ease;--transition-default: .2s ease;--transition-slow: .3s ease;--font-mono: "SF Mono", "Monaco", "Consolas", monospace}*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}#canvas{display:block;width:100vw;height:100vh;touch-action:none}.info{position:fixed;bottom:20px;left:20px;right:20px;display:flex;justify-content:space-between;align-items:center;color:var(--color-text-muted);font-size:13px;pointer-events:none;z-index:100}.info-text{opacity:.8;transition:opacity var(--transition-slow)}.fps{font-family:var(--font-mono);font-size:12px;background:#0006;padding:4px 10px;border-radius:12px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.gui{position:fixed;top:20px;right:20px;width:290px;background:var(--color-bg-primary);border-radius:16px;border:1px solid var(--color-border-subtle);-webkit-backdrop-filter:var(--blur-standard);backdrop-filter:var(--blur-standard);box-shadow:var(--shadow-panel);z-index:1000;overflow:hidden;transition:transform .3s ease,opacity .3s ease;animation:fadeIn .5s ease}.gui-header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#ffffff08;border-bottom:1px solid rgba(255,255,255,.08);color:#fff;font-weight:600;font-size:14px;cursor:pointer;-webkit-user-select:none;user-select:none}.gui-toggle{display:flex;align-items:center;justify-content:center;background:#ffffff1a;border:none;color:#fff;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:12px;padding:0;margin:0;transition:background .2s ease}.gui-toggle:hover{background:#fff3}.gui-content{padding:16px;max-height:70vh;overflow-y:auto;overflow-x:visible;transition:max-height .3s ease,padding .3s ease,opacity .3s ease}.gui-content.collapsed{max-height:0;padding:0 16px;opacity:0;overflow:hidden}.gui:has(.gui-content.collapsed) .gui-header{border-bottom:none}.gui-section{margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06);max-width:100%}.gui-section:last-of-type{border-bottom:none;margin-bottom:0;padding-bottom:0}.gui-section-title{color:#ffffffe6;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px}.gui-group{margin-bottom:14px}.gui-group:last-of-type{margin-bottom:10px}.gui-group.gui-row{display:flex;justify-content:space-between;align-items:center}.gui-group.gui-row label{margin-bottom:0}.gui-group label{display:block;color:#ffffffb3;font-size:12px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}.gui-group:has(input[type=range]){display:flex;flex-wrap:wrap;align-items:center}.gui-group:has(input[type=range]) label{flex-basis:100%;margin-bottom:8px}.gui-group input[type=range]{flex:1 1 auto;width:0;min-width:0;height:6px;background:#ffffff1f;border-radius:3px;outline:none;-webkit-appearance:none;appearance:none;cursor:pointer;transition:background .2s ease;margin-right:8px}.gui-group input[type=range]:hover{background:#ffffff2e}.gui-group input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;background:#fff;border-radius:50%;cursor:pointer;box-shadow:0 1px 4px #0006;transition:transform .15s ease}.gui-group input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.1)}.gui-group input[type=range]::-moz-range-thumb{width:14px;height:14px;background:#fff;border-radius:50%;cursor:pointer;border:none;box-shadow:0 1px 4px #0006}.gui-group input[type=range]::-moz-range-track{background:#ffffff1f;height:6px;border-radius:3px}.gui-group span{flex-shrink:0;width:40px;text-align:right;color:#fff;font-size:12px;font-family:SF Mono,Monaco,Consolas,monospace}.gui-group input[type=checkbox],.custom-color-checkbox{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:18px!important;height:18px!important;cursor:pointer;background:#ffffff14;border:1px solid rgba(255,255,255,.2);border-radius:5px;position:relative;transition:all .2s ease;flex-shrink:0;display:flex;align-items:center;justify-content:center}.gui-group input[type=checkbox]:hover,.custom-color-checkbox:hover{background:#ffffff1f;border-color:#ffffff4d}.gui-group input[type=checkbox]:checked,.custom-color-checkbox:checked{background:#64b4ff4d;border-color:#64b4ff99}.gui-group input[type=checkbox]:checked:after,.custom-color-checkbox:checked:after{content:"";position:absolute;top:50%;left:50%;width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:translate(-50%,-60%) rotate(45deg)}.custom-dropdown{position:relative;width:100%;-webkit-user-select:none;user-select:none}.custom-dropdown-trigger{width:100%;padding:10px 36px 10px 14px;background:var(--color-bg-input);border:1px solid var(--color-border-default);border-radius:var(--radius-lg);color:var(--color-text-primary);font-size:13px;font-weight:500;cursor:pointer;outline:none;transition:all var(--transition-default);text-align:left;position:relative}.custom-dropdown-trigger:after{content:"";position:absolute;right:14px;top:50%;transform:translateY(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid rgba(255,255,255,.5);transition:transform .2s ease,border-color .2s ease}.custom-dropdown.open .custom-dropdown-trigger:after{transform:translateY(-50%) rotate(180deg)}.custom-dropdown-trigger:hover{background:var(--color-bg-input-hover);border-color:var(--color-border-hover)}.custom-dropdown-trigger:hover:after{border-top-color:#ffffffb3}.custom-dropdown.open .custom-dropdown-trigger{border-bottom-left-radius:0;border-bottom-right-radius:0}.custom-dropdown-menu{position:absolute;top:100%;left:0;right:0;background:#121218fa;border:1px solid var(--color-border-default);border-top:none;border-radius:0 0 var(--radius-lg) var(--radius-lg);max-height:0;overflow:hidden;opacity:0;transition:max-height .25s ease,opacity var(--transition-default);z-index:1001;box-shadow:0 8px 24px #0009;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}.custom-dropdown.open .custom-dropdown-menu{max-height:240px;overflow-y:auto;opacity:1}.custom-dropdown-option{padding:10px 14px;color:#ffffffd9;font-size:13px;cursor:pointer;transition:all .15s ease;border-left:2px solid transparent}.custom-dropdown-option:hover{background:var(--color-accent-bg-hover);color:var(--color-text-primary);border-left-color:var(--color-accent-dim)}.custom-dropdown-option.selected{background:var(--color-accent-bg);color:var(--color-text-primary);border-left-color:var(--color-accent)}.custom-dropdown-option:first-child{border-radius:0}.custom-dropdown-option:last-child{border-radius:0 0 7px 7px}.gui-group select.hidden{display:none}.gui-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:16px;position:relative}.btn{flex:1 1 auto;padding:10px 12px;background:var(--color-bg-button);border:1px solid var(--color-border-strong);border-radius:var(--radius-lg);color:var(--color-text-primary);font-size:12px;font-weight:500;cursor:pointer;transition:all var(--transition-default)}.btn:hover{background:var(--color-bg-button-hover);border-color:var(--color-border-active)}.btn:active{background:var(--color-bg-input-hover)}.settings-dropdown{position:relative;flex:1 1 auto}.settings-dropdown .btn{width:100%}.settings-submenu{position:absolute;bottom:calc(100% + 6px);left:0;right:0;min-width:140px;background:#121218fa;border:1px solid var(--color-border-strong);border-radius:var(--radius-lg);padding:6px;opacity:0;visibility:hidden;transform:translateY(8px);transition:all var(--transition-default);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 8px 24px #0009;z-index:1002}.settings-submenu.open{opacity:1;visibility:visible;transform:translateY(0)}.settings-submenu-btn{display:block;width:100%;padding:10px 12px;background:transparent;border:none;border-radius:var(--radius-md);color:var(--color-text-primary);font-size:12px;font-weight:500;text-align:left;cursor:pointer;transition:background var(--transition-fast)}.settings-submenu-btn:hover{background:var(--color-bg-input-hover)}.settings-submenu-btn:active{background:#ffffff0d}.settings-submenu-divider{height:1px;background:var(--color-border-subtle);margin:6px 0}.settings-submenu-checkbox{display:flex;align-items:center;gap:8px;padding:10px 12px;color:var(--color-text-primary);font-size:12px;font-weight:500;cursor:pointer;border-radius:var(--radius-md);transition:background var(--transition-fast)}.settings-submenu-checkbox:hover{background:var(--color-bg-input-hover)}.settings-submenu-checkbox input[type=checkbox]{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:18px!important;height:18px!important;cursor:pointer;background:#ffffff14;border:1px solid rgba(255,255,255,.2);border-radius:5px;position:relative;transition:all .2s ease;flex-shrink:0;display:flex;align-items:center;justify-content:center}.settings-submenu-checkbox input[type=checkbox]:hover{background:#ffffff1f;border-color:#ffffff4d}.settings-submenu-checkbox input[type=checkbox]:checked{background:#64b4ff4d;border-color:#64b4ff99}.settings-submenu-checkbox input[type=checkbox]:checked:after{content:"";position:absolute;top:50%;left:50%;width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:translate(-50%,-60%) rotate(45deg)}.toast{position:fixed;bottom:80px;left:50%;transform:translate(-50%) translateY(20px);background:var(--color-bg-panel);color:var(--color-text-primary);padding:12px 24px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid var(--color-border-strong);-webkit-backdrop-filter:var(--blur-standard);backdrop-filter:var(--blur-standard);box-shadow:var(--shadow-button);opacity:0;transition:all var(--transition-slow);z-index:2000;pointer-events:none}.toast.show{opacity:1;transform:translate(-50%) translateY(0)}.gui-content::-webkit-scrollbar,.custom-dropdown-menu::-webkit-scrollbar{width:6px}.gui-content::-webkit-scrollbar-track,.custom-dropdown-menu::-webkit-scrollbar-track{background:transparent}.gui-content::-webkit-scrollbar-thumb,.custom-dropdown-menu::-webkit-scrollbar-thumb{background:#fff3;border-radius:3px}.gui-content::-webkit-scrollbar-thumb:hover,.custom-dropdown-menu::-webkit-scrollbar-thumb:hover{background:#ffffff4d}@media(max-width:600px){.gui{width:calc(100% - 40px);top:10px;right:20px}.info{bottom:10px;left:10px;right:10px;font-size:12px}}@keyframes fadeIn{0%{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.custom-palette-container{margin:12px 0;padding:12px;background:#ffffff08;border-radius:var(--radius-lg);border:1px solid rgba(255,255,255,.08)}.gui-group-label{color:#fff9;font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}.custom-color-list{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}.custom-color-row{display:flex;align-items:center;gap:10px;min-width:0}.color-picker-wrapper{position:relative;flex:1;min-width:0}.color-picker-trigger{width:100%;height:36px;border:1px solid var(--color-border-strong);border-radius:var(--radius-lg);cursor:pointer;background:#ffffff0a;padding:4px;transition:all var(--transition-default);display:block}.color-picker-trigger:hover{border-color:var(--color-border-hover);background:var(--color-bg-button);box-shadow:0 2px 8px #0003}.color-picker-wrapper.open .color-picker-trigger{border-color:var(--color-accent-dim);box-shadow:0 0 0 3px #64b4ff1a}.color-picker-swatch{width:100%;height:100%;border-radius:5px;box-shadow:inset 0 0 0 1px #00000026}.color-picker-panel{position:absolute;top:calc(100% + 8px);left:50%;transform:translate(-50%) translateY(-8px);width:220px;background:#121218fa;border:1px solid var(--color-border-strong);border-radius:var(--radius-xl);padding:14px;box-shadow:0 12px 40px #0009;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);z-index:1002;opacity:0;visibility:hidden;transition:opacity var(--transition-default),transform var(--transition-default),visibility var(--transition-default)}.color-picker-wrapper.open .color-picker-panel{opacity:1;visibility:visible;transform:translate(-50%) translateY(0)}.color-picker-saturation{position:relative;width:100%;height:140px;border-radius:8px;cursor:crosshair;overflow:hidden;margin-bottom:12px}.color-picker-saturation-bg{position:absolute;inset:0;border-radius:8px}.color-picker-saturation-white{position:absolute;inset:0;background:linear-gradient(to right,#fff,transparent);border-radius:8px}.color-picker-saturation-black{position:absolute;inset:0;background:linear-gradient(to top,#000,transparent);border-radius:8px}.color-picker-saturation-handle{position:absolute;width:14px;height:14px;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px #0006,inset 0 0 0 1px #0000001a;transform:translate(-50%,-50%);pointer-events:none}.color-picker-hue{position:relative;width:100%;height:14px;border-radius:7px;background:linear-gradient(to right,red,#ff0 17%,#0f0 33%,#0ff,#00f 67%,#f0f 83%,red);cursor:pointer;margin-bottom:12px}.color-picker-hue-handle{position:absolute;top:50%;width:18px;height:18px;background:#fff;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px #0000004d;transform:translate(-50%,-50%);pointer-events:none}.color-picker-format-tabs{display:flex;gap:4px;margin-bottom:8px}.color-picker-format-tab{flex:1;padding:6px 8px;background:var(--color-bg-input);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);color:var(--color-text-tertiary);font-size:10px;font-weight:600;cursor:pointer;transition:all var(--transition-default)}.color-picker-format-tab:hover{background:var(--color-bg-input-hover);color:var(--color-text-secondary)}.color-picker-format-tab.active{background:var(--color-accent-bg);border-color:var(--color-accent-border);color:var(--color-accent)}.color-picker-input-row{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden}.color-picker-input-label{color:var(--color-text-tertiary);font-size:11px;font-weight:600;min-width:16px}.color-picker-hex-input{flex:1;min-width:0;padding:8px 10px;background:var(--color-bg-button);border:1px solid var(--color-border-default);border-radius:var(--radius-md);color:var(--color-text-primary);font-size:12px;font-family:var(--font-mono);text-transform:uppercase;outline:none;transition:all var(--transition-default)}.color-picker-hex-input:focus{border-color:var(--color-accent-dim);background:var(--color-bg-input-hover)}.color-picker-input-group{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}.color-picker-input-group .color-picker-input-label{text-align:center}.color-picker-number-input{width:100%;padding:8px 6px;background:var(--color-bg-button);border:1px solid var(--color-border-default);border-radius:var(--radius-md);color:var(--color-text-primary);font-size:12px;font-family:var(--font-mono);text-align:center;outline:none;transition:all var(--transition-default);-moz-appearance:textfield;appearance:textfield}.color-picker-number-input::-webkit-outer-spin-button,.color-picker-number-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.color-picker-number-input:focus{border-color:var(--color-accent-dim);background:var(--color-bg-input-hover)}.color-picker-preview{width:32px;height:32px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);box-shadow:inset 0 0 0 1px #0000001a;flex-shrink:0}.custom-color-picker.hidden{display:none}.custom-color-remove{width:26px;height:26px;padding:0;background:var(--color-danger-bg);border:1px solid var(--color-danger-border);border-radius:var(--radius-md);color:var(--color-danger-text);font-size:14px;font-weight:500;line-height:1;cursor:pointer;transition:all var(--transition-default);flex-shrink:0;display:flex;align-items:center;justify-content:center}.custom-color-remove:hover{background:var(--color-danger-bg-hover);border-color:#ff646459;color:var(--color-text-primary);transform:scale(1.05)}.btn-small{flex:none;width:100%;padding:8px 12px;font-size:11px}[data-tooltip]{position:relative;cursor:help}[data-tooltip]:after{content:attr(data-tooltip);position:absolute;left:0;bottom:calc(100% + 8px);width:max-content;max-width:220px;padding:8px 12px;background:#0a0a0ff2;border:1px solid var(--color-border-strong);border-radius:var(--radius-lg);color:#ffffffe6;font-size:11px;font-weight:400;line-height:1.4;text-transform:none;letter-spacing:0;white-space:normal;opacity:0;visibility:hidden;transform:translateY(4px);transition:all var(--transition-default);pointer-events:none;z-index:1002;box-shadow:0 4px 16px #0006}[data-tooltip]:before{content:"";position:absolute;left:16px;bottom:calc(100% + 2px);border:6px solid transparent;border-top-color:#0a0a0ff2;opacity:0;visibility:hidden;transition:all var(--transition-default);pointer-events:none;z-index:1003}[data-tooltip]:hover:after,[data-tooltip]:hover:before{opacity:1;visibility:visible;transform:translateY(0)}.gui-section-title[data-tooltip]:after{max-width:240px}';
L.injectStyles(it);
class xe {
  simulation;
  runner;
  gui = null;
  inputHandler = null;
  _keyboardHandler = null;
  canvas;
  static create(e, t) {
    return new xe({ canvas: e, ...t });
  }
  constructor(e) {
    if (typeof e.canvas == "string") {
      const t = document.querySelector(e.canvas);
      if (!t) throw new Error(`Canvas not found: ${e.canvas}`);
      this.canvas = t;
    } else
      this.canvas = e.canvas;
    if (e.storageKey && De(e.storageKey), e.loadSavedConfig !== !1 && Ye(), e.initialConfig)
      for (const [t, r] of Object.entries(e.initialConfig))
        g(t, r);
    this.simulation = new qe(this.canvas), e.showGUI !== !1 && (this.gui = new L(this.simulation, { forceHideUI: e.forceHideUI })), e.enableInput !== !1 && (this.inputHandler = new et(this.canvas, this.simulation)), e.enableKeyboard !== !1 && this.gui && (this._keyboardHandler = new tt(this.simulation, this.gui, this.canvas)), this.runner = new E({
      simulation: this.simulation,
      inputHandler: this.inputHandler,
      onFrame: (t) => {
        const r = document.getElementById("fps");
        r && (r.textContent = `${t} FPS`);
      }
    }), e.autoStart !== !1 && this.start();
  }
  start() {
    this.runner.start();
  }
  stop() {
    this.runner.stop();
  }
  pause(e) {
    g("PAUSED", e ?? !Q().PAUSED);
  }
  isPaused() {
    return Q().PAUSED;
  }
  addSplats(e) {
    this.simulation.addSplats(e ?? Math.floor(Math.random() * 5) + 3);
  }
  splat(e, t, r, o, i) {
    this.simulation.splat(e, t, r, o, i ?? N());
  }
  setConfig(e, t) {
    g(e, t);
  }
  getConfig() {
    return Q();
  }
  resetConfig() {
    ee();
  }
  getSimulation() {
    return this.simulation;
  }
  getGUI() {
    return this.gui;
  }
  getKeyboardHandler() {
    return this._keyboardHandler;
  }
  takeScreenshot() {
    this.gui?.takeScreenshot?.();
  }
  destroy() {
    this.stop(), this.gui?.destroy();
  }
}
export {
  D as COLOR_PALETTES,
  xe as FluidSimulator
};
