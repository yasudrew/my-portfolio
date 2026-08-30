import { glsl } from "@/gl/shaders/glsl";

/**
 * Final presentation of the dye field.
 *
 * The raw dye buffer is flat — pretty, but obviously 2D. Two things give it
 * body: a pseudo-normal derived from the density gradient (so the fluid catches
 * a light and reads as a volume), and a thin-film interference term keyed off
 * that normal, which produces the oil-on-water iridescence the whole visual
 * identity leans on.
 */
export const DISPLAY_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  uniform sampler2D uTexture;
  uniform vec3 uBackground;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uIridescence;

  float luma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }

  // Thin-film style spectrum: cheap, smooth, and stays inside the palette.
  vec3 spectrum(float t) {
    return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
  }

  void main() {
    vec3 c = texture2D(uTexture, vUv).rgb;

    float lL = luma(texture2D(uTexture, vL).rgb);
    float lR = luma(texture2D(uTexture, vR).rgb);
    float lT = luma(texture2D(uTexture, vT).rgb);
    float lB = luma(texture2D(uTexture, vB).rgb);

    // pseudo-normal from the density gradient
    vec3 normal = normalize(vec3(lR - lL, lT - lB, 0.12));
    vec3 lightDir = normalize(vec3(-0.35, 0.55, 0.75));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    float diffuse = clamp(dot(normal, lightDir) * 0.5 + 0.75, 0.0, 1.4);
    vec3 halfway = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfway), 0.0), 24.0);

    float density = luma(c);
    float edge = length(vec2(lR - lL, lT - lB));

    // iridescence rides on the slope, so it rims the filaments instead of
    // washing the whole field
    vec3 film = spectrum(edge * 2.4 + density * 0.35 + uTime * 0.02);
    vec3 color = c * diffuse;
    color = mix(color, color * film * 1.6, clamp(edge * 3.0, 0.0, 1.0) * uIridescence);
    color += specular * 0.35 * smoothstep(0.02, 0.25, density);

    color *= uIntensity;

    // lift the contrast so the darks stay genuinely dark — the empty space is
    // what makes the filaments read, and what keeps the type legible over them
    color = pow(max(color, 0.0), vec3(1.25));

    // the dye is additive over the page background
    color += uBackground;

    vec2 v = vUv - 0.5;
    color *= 1.0 - dot(v, v) * 0.85;

    gl_FragColor = vec4(color, 1.0);
  }
`;
