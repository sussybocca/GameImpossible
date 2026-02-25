import * as THREE from 'three';

export class ShaderManager {
    constructor() {
        this.shaders = {};
    }

    init() {
        // Portal shader
        this.shaders.portal = {
            vertex: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vec2 uv = vUv * 2.0 - 1.0;
                    float r = length(uv);
                    float a = atan(uv.y, uv.x);
                    float t = time * 2.0;
                    float c = sin(r * 10.0 - t) * 0.5 + 0.5;
                    float c2 = sin(a * 5.0 + t) * 0.5 + 0.5;
                    vec3 color = mix(vec3(0.0, 0.5, 1.0), vec3(1.0, 0.5, 0.0), c);
                    gl_FragColor = vec4(color, 1.0 - r);
                }
            `
        };

        // Water shader
        this.shaders.water = {
            vertex: `
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    vec2 uv = vUv * 4.0;
                    float wave1 = sin(uv.x * 2.0 + time) * sin(uv.y * 2.0 + time);
                    float wave2 = sin(uv.x * 3.0 - time * 1.3) * sin(uv.y * 3.0 - time * 1.3);
                    float intensity = (wave1 + wave2) * 0.25 + 0.5;
                    vec3 color = mix(vec3(0.0, 0.3, 0.6), vec3(0.2, 0.6, 0.9), intensity);
                    gl_FragColor = vec4(color, 0.8);
                }
            `
        };
    }

    getShader(name) {
        return this.shaders[name];
    }
}
