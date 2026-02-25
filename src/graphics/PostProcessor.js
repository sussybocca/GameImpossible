import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';

export class PostProcessor {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = new EffectComposer(renderer);
        this.passes = {};
    }

    init() {
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.1;
        bloomPass.strength = 1.2;
        bloomPass.radius = 0.5;
        this.composer.addPass(bloomPass);
        this.passes.bloom = bloomPass;

        // RGB Shift (chromatic aberration)
        const rgbShiftPass = new ShaderPass(RGBShiftShader);
        rgbShiftPass.uniforms['amount'].value = 0.005;
        this.composer.addPass(rgbShiftPass);
        this.passes.rgbShift = rgbShiftPass;

        // Afterimage (motion blur effect)
        const afterimagePass = new AfterimagePass(0.9);
        afterimagePass.renderToScreen = true;
        this.composer.addPass(afterimagePass);
        this.passes.afterimage = afterimagePass;

        // Glitch (for time dilation effect)
        const glitchPass = new GlitchPass();
        glitchPass.goWild = false;
        this.composer.addPass(glitchPass);
        this.passes.glitch = glitchPass;
        glitchPass.enabled = false;
    }

    render(deltaTime) {
        // Update uniforms if needed
        if (this.passes.glitch.enabled && Math.random() > 0.95) {
            this.passes.glitch.goWild = true;
        } else {
            this.passes.glitch.goWild = false;
        }

        this.composer.render();
    }

    setBloom(enable) {
        this.passes.bloom.enabled = enable;
    }

    setGlitch(enable) {
        this.passes.glitch.enabled = enable;
    }
}
