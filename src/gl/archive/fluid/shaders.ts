import { glsl } from "@/gl/shaders/glsl";

/**
 * Shader sources for the Stable Fluids solver.
 *
 * The pipeline follows Stam's "Stable Fluids" split-step method:
 *
 *   curl -> vorticity confinement -> divergence -> pressure (Jacobi)
 *        -> gradient subtract -> advect velocity -> advect dye
 *
 * All passes share one vertex shader that also precomputes the four neighbour
 * texel coordinates, so the fragment stage never does address arithmetic.
 */

export const BASE_VERTEX = glsl`
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  uniform vec2 uTexelSize;

  void main() {
    vUv = uv;
    vL = vUv - vec2(uTexelSize.x, 0.0);
    vR = vUv + vec2(uTexelSize.x, 0.0);
    vT = vUv + vec2(0.0, uTexelSize.y);
    vB = vUv - vec2(0.0, uTexelSize.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const ADVECTION_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;

  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uDissipation;

  void main() {
    // semi-Lagrangian backtrace
    vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexelSize;
    vec4 result = texture2D(uSource, coord);
    float decay = 1.0 + uDissipation * uDt;
    gl_FragColor = result / decay;
  }
`;

export const SPLAT_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;

  uniform sampler2D uTarget;
  uniform float uAspectRatio;
  uniform vec3 uColor;
  uniform vec2 uPoint;
  uniform float uRadius;

  void main() {
    vec2 p = vUv - uPoint;
    p.x *= uAspectRatio;
    vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

export const CURL_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  uniform sampler2D uVelocity;

  void main() {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

export const VORTICITY_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float uCurlStrength;
  uniform float uDt;

  void main() {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    // push velocity along the vorticity gradient to restore the small eddies
    // that the semi-Lagrangian advection numerically damps away
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= uCurlStrength * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * uDt;
    velocity = clamp(velocity, -1000.0, 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

export const DIVERGENCE_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  uniform sampler2D uVelocity;

  void main() {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;

    // free-slip boundary: mirror the normal component at the walls
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }

    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

export const CLEAR_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;

  uniform sampler2D uTexture;
  uniform float uValue;

  void main() {
    gl_FragColor = uValue * texture2D(uTexture, vUv);
  }
`;

export const PRESSURE_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;

  void main() {
    // one Jacobi relaxation step of the Poisson equation
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

export const GRADIENT_SUBTRACT_FRAGMENT = glsl`
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;
