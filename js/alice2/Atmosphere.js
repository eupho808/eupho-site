/**
 * WebGL post-processing for atmospheric effects:
 * vignette, film grain, chromatic aberration, ink bleed, subtle distortion.
 */
export class Atmosphere {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.supported = false;

    try {
      this.gl = canvas.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer: true }) ||
                canvas.getContext('experimental-webgl', { alpha: true, antialias: false, preserveDrawingBuffer: true });
    } catch (e) {
      this.gl = null;
    }

    if (!this.gl) {
      console.warn('WebGL not supported, falling back to canvas rendering');
      return;
    }

    this.supported = true;
    this.time = 0;
    this.hysteria = 0;
    this.distortion = 0;

    this.setupQuad();
    this.program = this.createProgram();
    if (!this.program) {
      console.warn('WebGL shader program failed, falling back to canvas rendering');
      this.supported = false;
      this.gl = null;
      return;
    }
    this.locations = this.getLocations();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  setupQuad() {
    const gl = this.gl;
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram() {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = vec2(a_position.x * 0.5 + 0.5, a_position.y * 0.5 + 0.5);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `);

    const fs = this.createShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_source;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_hysteria;
      uniform float u_distortion;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = v_uv;
        vec2 center = uv - 0.5;
        float dist = length(center);

        // Chromatic aberration
        float aberration = 0.003 + u_hysteria * 0.02 + u_distortion * 0.01;
        vec2 dir = normalize(center + 0.001);
        float r = texture2D(u_source, uv + dir * aberration * dist).r;
        float g = texture2D(u_source, uv).g;
        float b = texture2D(u_source, uv - dir * aberration * dist).b;
        vec3 color = vec3(r, g, b);

        // Subtle wave distortion
        float wave = sin(uv.y * 80.0 + u_time * 2.0) * 0.001;
        wave += sin(uv.x * 60.0 + u_time * 1.5) * 0.001;
        wave *= (1.0 + u_hysteria * 3.0 + u_distortion);
        color = texture2D(u_source, uv + vec2(wave, 0.0)).rgb;

        // Vignette
        float vignette = 1.0 - smoothstep(0.4, 1.2, dist);
        color *= mix(0.3, 1.0, vignette);

        // Film grain
        float grain = noise(uv * 800.0 + u_time * 10.0);
        color += (grain - 0.5) * 0.06;

        // Ink bleed / blood tint in hysteria
        if (u_hysteria > 0.0) {
          color = mix(color, vec3(0.6, 0.0, 0.0), u_hysteria * 0.35);
          float pulse = sin(u_time * 8.0) * 0.5 + 0.5;
          color += vec3(0.1, 0.0, 0.0) * u_hysteria * pulse;
        }

        // Sickly green tint in distortion
        if (u_distortion > 0.0) {
          color = mix(color, vec3(0.2, 0.35, 0.15), u_distortion * 0.2);
        }

        // Contrast
        color = pow(color, vec3(1.15));

        gl_FragColor = vec4(color, 1.0);
      }
    `);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
    }
    return program;
  }

  getLocations() {
    const gl = this.gl;
    return {
      position: gl.getAttribLocation(this.program, 'a_position'),
      source: gl.getUniformLocation(this.program, 'u_source'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      time: gl.getUniformLocation(this.program, 'u_time'),
      hysteria: gl.getUniformLocation(this.program, 'u_hysteria'),
      distortion: gl.getUniformLocation(this.program, 'u_distortion')
    };
  }

  render(sourceCanvas, dt, hysteria, distortion) {
    if (!this.supported || !this.gl) return;
    const gl = this.gl;
    this.time += dt;
    this.hysteria = lerp(this.hysteria, hysteria || 0, 8 * dt);
    this.distortion = lerp(this.distortion, distortion || 0, 5 * dt);

    // Create texture from source canvas
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.locations.source, 0);
    gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.locations.time, this.time);
    gl.uniform1f(this.locations.hysteria, this.hysteria);
    gl.uniform1f(this.locations.distortion, this.distortion);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.deleteTexture(texture);
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
