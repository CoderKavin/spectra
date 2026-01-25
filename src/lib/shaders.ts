// Metallic Noir Shader Utilities for SPECTRA 8

export const metallicVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const liquidMetalFragmentShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor;
  uniform float uMetalness;
  uniform float uRoughness;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 normal = normalize(vNormal);

    // Liquid metal ripple effect
    float noise = snoise(vec3(vUv * 5.0, uTime * 0.3));
    float ripple = sin(length(vUv - 0.5) * 20.0 - uTime * 2.0) * 0.5 + 0.5;

    // Fresnel effect for metallic rim
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);

    // Brushed metal streaks
    float brushed = snoise(vec3(vUv.x * 50.0, vUv.y * 2.0, uTime * 0.1));

    // Combine effects
    vec3 baseColor = uColor;
    vec3 highlightColor = vec3(0.95, 0.95, 1.0);
    vec3 rimColor = vec3(0.486, 0.227, 0.929); // Violet energy

    vec3 finalColor = mix(baseColor, highlightColor, fresnel * 0.5 + brushed * 0.1);
    finalColor += rimColor * fresnel * 0.8;
    finalColor += vec3(noise * 0.1);

    // Specular highlights
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float spec = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 64.0);
    finalColor += spec * 0.5;

    float alpha = 0.9 + fresnel * 0.1;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const filmGrainShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform sampler2D tDiffuse;
  varying vec2 vUv;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);

    float grain = rand(vUv * uTime) * uIntensity;
    color.rgb += grain - uIntensity * 0.5;

    gl_FragColor = color;
  }
`;

export const chromeShardShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Chrome reflection
    float fresnel = pow(1.0 - dot(normal, viewDir), 2.0);

    // Sharp metallic highlights
    vec3 reflectDir = reflect(-viewDir, normal);
    float spec = pow(max(reflectDir.y, 0.0), 32.0);

    vec3 chromeColor = vec3(0.9, 0.9, 0.95);
    vec3 violetTint = vec3(0.486, 0.227, 0.929);

    vec3 finalColor = chromeColor + violetTint * fresnel * 0.5;
    finalColor += spec * vec3(1.0);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const corridorShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor1;
  uniform vec3 uColor2;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec3 normal = normalize(vNormal);

    // Brushed metal effect
    float brushed = noise(vec2(vUv.x * 100.0, vUv.y * 10.0 + uTime * 0.1)) * 0.15;

    // Panel seams
    float seams = step(0.98, fract(vPosition.y * 0.5)) * 0.3;
    seams += step(0.98, fract(vPosition.x * 0.3)) * 0.3;

    // Base metallic color
    vec3 baseColor = mix(uColor1, uColor2, vUv.y);
    baseColor -= seams;
    baseColor += brushed;

    // Fresnel rim
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

    vec3 rimColor = vec3(0.486, 0.227, 0.929);
    baseColor += rimColor * fresnel * 0.4;

    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

// Post-processing shader for cinematic look
export const cinematicPostShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignetteIntensity;
    uniform float uGrainIntensity;
    uniform vec3 uTint;

    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Vignette
      float dist = length(vUv - 0.5);
      float vignette = smoothstep(0.8, 0.3, dist);
      color.rgb *= mix(1.0, vignette, uVignetteIntensity);

      // Film grain
      float grain = rand(vUv * uTime * 100.0) * uGrainIntensity;
      color.rgb += grain - uGrainIntensity * 0.5;

      // Color tint
      color.rgb = mix(color.rgb, color.rgb * uTint, 0.1);

      // Slight chromatic aberration
      float aberration = 0.001;
      color.r = texture2D(tDiffuse, vUv + vec2(aberration, 0.0)).r;
      color.b = texture2D(tDiffuse, vUv - vec2(aberration, 0.0)).b;

      gl_FragColor = color;
    }
  `
};
