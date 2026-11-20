// WebGL Post-Processing Pipeline: True Bloom, Chromatic Aberration, and Water Shimmer

const VERT_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uTime;
uniform float uAberration;
uniform float uBloomStrength;
uniform float uPhaseMix; // 0.0 = solar, 1.0 = lunar
uniform float uEnabled;

vec3 sampleBright(vec2 uv) {
  vec3 c = texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  float mask = smoothstep(0.68, 0.95, lum);
  return c * mask;
}

void main() {
  if (uEnabled < 0.5) {
    gl_FragColor = texture2D(uTex, vUv);
    return;
  }

  // 1. Radial Chromatic Aberration (spikes on Phase Shift / Ground Pound / Boss Hit)
  vec2 centered = vUv - vec2(0.5);
  float dist = length(centered);
  vec2 dir = dist > 0.0001 ? centered / dist : vec2(0.0);
  float ca = uAberration * (0.004 + dist * 0.018);

  float r = texture2D(uTex, clamp(vUv + dir * ca, 0.001, 0.999)).r;
  float g = texture2D(uTex, vUv).g;
  float b = texture2D(uTex, clamp(vUv - dir * ca, 0.001, 0.999)).b;
  vec3 baseColor = vec3(r, g, b);

  // 2. Multi-tap Star/Gaussian Bloom
  vec2 px = uTexel * 2.4;
  vec3 bloom = sampleBright(vUv) * 0.24;
  bloom += sampleBright(vUv + vec2( px.x,  0.0)) * 0.12;
  bloom += sampleBright(vUv + vec2(-px.x,  0.0)) * 0.12;
  bloom += sampleBright(vUv + vec2( 0.0,  px.y)) * 0.12;
  bloom += sampleBright(vUv + vec2( 0.0, -px.y)) * 0.12;
  bloom += sampleBright(vUv + vec2( px.x,  px.y) * 1.4) * 0.07;
  bloom += sampleBright(vUv + vec2(-px.x,  px.y) * 1.4) * 0.07;
  bloom += sampleBright(vUv + vec2( px.x, -px.y) * 1.4) * 0.07;
  bloom += sampleBright(vUv + vec2(-px.x, -px.y) * 1.4) * 0.07;

  // Phase-tinted bloom warmth/coolness
  vec3 bloomTint = mix(vec3(1.08, 0.96, 0.85), vec3(0.84, 0.98, 1.12), uPhaseMix);
  vec3 color = baseColor + bloom * bloomTint * uBloomStrength;

  // Subtle chromatic shock flash rim when aberration is high
  color += bloomTint * (uAberration * dist * 0.16);

  gl_FragColor = vec4(color, 1.0);
}
`;

export class WebGLPostProcessor {
  constructor(displayCanvas) {
    this.displayCanvas = displayCanvas;
    this.enabled = true;
    this.supported = false;
    this.aberration = 0;
    this.phaseMix = 0;

    const gl = displayCanvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;
    this.gl = gl;

    const vs = this._compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = this._compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    this.program = prog;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    this.uTex = gl.getUniformLocation(prog, 'uTex');
    this.uTexel = gl.getUniformLocation(prog, 'uTexel');
    this.uTime = gl.getUniformLocation(prog, 'uTime');
    this.uAberration = gl.getUniformLocation(prog, 'uAberration');
    this.uBloomStrength = gl.getUniformLocation(prog, 'uBloomStrength');
    this.uPhaseMix = gl.getUniformLocation(prog, 'uPhaseMix');
    this.uEnabled = gl.getUniformLocation(prog, 'uEnabled');

    this.supported = true;
  }

  _compile(type, src) {
    const gl = this.gl;
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader compile error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  triggerAberration(strength = 1.0) {
    this.aberration = Math.max(this.aberration, strength);
  }

  update(dt, isLunar) {
    const target = isLunar ? 1 : 0;
    this.phaseMix += (target - this.phaseMix) * Math.min(1, dt * 8);
    if (this.aberration > 0.002) {
      this.aberration *= Math.pow(0.004, dt);
    } else {
      this.aberration = 0;
    }
  }

  render(sourceCanvas, time) {
    if (!this.supported) return false;
    const gl = this.gl;
    if (
      this.displayCanvas.width !== sourceCanvas.width ||
      this.displayCanvas.height !== sourceCanvas.height
    ) {
      this.displayCanvas.width = sourceCanvas.width;
      this.displayCanvas.height = sourceCanvas.height;
    }
    gl.viewport(0, 0, this.displayCanvas.width, this.displayCanvas.height);
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    gl.uniform1i(this.uTex, 0);
    gl.uniform2f(this.uTexel, 1 / sourceCanvas.width, 1 / sourceCanvas.height);
    gl.uniform1f(this.uTime, time);
    gl.uniform1f(this.uAberration, this.aberration);
    gl.uniform1f(this.uBloomStrength, 0.34);
    gl.uniform1f(this.uPhaseMix, this.phaseMix);
    gl.uniform1f(this.uEnabled, this.enabled ? 1 : 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return true;
  }
}
