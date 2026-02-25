import * as THREE from 'three';   // <-- Add this line
export class Engine {
    constructor() {
        this.clock = new THREE.Clock();
        this.updateCallback = null;
        this.rafId = null;
        this.fixedDelta = 1 / 60;
        this.accumulator = 0;
    }

    start(updateCallback) {
        this.updateCallback = updateCallback;
        this.loop();
    }

    loop() {
        const delta = Math.min(this.clock.getDelta(), 0.1);
        this.accumulator += delta;

        // Fixed timestep for physics
        while (this.accumulator >= this.fixedDelta) {
            if (this.updateCallback) {
                this.updateCallback(this.fixedDelta);
            }
            this.accumulator -= this.fixedDelta;
        }

        // Request next frame
        this.rafId = requestAnimationFrame(() => this.loop());
    }

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}
