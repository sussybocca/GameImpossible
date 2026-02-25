import * as THREE from 'three';
import { PerlinNoise } from '../utils/PerlinNoise.js';

export class AssetGenerator {
    constructor() {
        this.textures = {};
        this.models = {};
        this.sounds = {};
        this.audioContext = null;
        this.noise = new PerlinNoise();
    }

    async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.generateTextures();
        this.generateModels();
        this.generateSounds();
    }

    generateTextures() {
        // Advanced procedural textures using Perlin noise
        const size = 1024;

        // Wall diffuse
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size - 0.5;
                const ny = y / size - 0.5;
                const val = this.noise.noise(nx * 4, ny * 4, 0) * 0.5 + 0.5;
                const idx = (y * size + x) * 4;
                imgData.data[idx] = val * 255;
                imgData.data[idx+1] = val * 255;
                imgData.data[idx+2] = val * 255;
                imgData.data[idx+3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        this.textures.wallDiffuse = new THREE.CanvasTexture(canvas);

        // Normal map from height
        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = size;
        normalCanvas.height = size;
        const nCtx = normalCanvas.getContext('2d');
        const nData = nCtx.createImageData(size, size);
        for (let y = 1; y < size-1; y++) {
            for (let x = 1; x < size-1; x++) {
                const hL = this.noise.noise((x-1)/size*4, y/size*4, 0);
                const hR = this.noise.noise((x+1)/size*4, y/size*4, 0);
                const hD = this.noise.noise(x/size*4, (y-1)/size*4, 0);
                const hU = this.noise.noise(x/size*4, (y+1)/size*4, 0);
                const dx = hR - hL;
                const dy = hU - hD;
                const nx = -dx * 0.5;
                const ny = -dy * 0.5;
                const nz = 1.0;
                const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
                const r = (nx/len + 1) / 2 * 255;
                const g = (ny/len + 1) / 2 * 255;
                const b = (nz/len) * 255;
                const idx = (y * size + x) * 4;
                nData.data[idx] = r;
                nData.data[idx+1] = g;
                nData.data[idx+2] = b;
                nData.data[idx+3] = 255;
            }
        }
        nCtx.putImageData(nData, 0, 0);
        this.textures.wallNormal = new THREE.CanvasTexture(normalCanvas);

        // Roughness map
        const roughCanvas = document.createElement('canvas');
        roughCanvas.width = size;
        roughCanvas.height = size;
        const rCtx = roughCanvas.getContext('2d');
        const rData = rCtx.createImageData(size, size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const val = this.noise.noise(x/size*8, y/size*8, 1) * 0.3 + 0.7;
                const idx = (y * size + x) * 4;
                rData.data[idx] = val * 255;
                rData.data[idx+1] = val * 255;
                rData.data[idx+2] = val * 255;
                rData.data[idx+3] = 255;
            }
        }
        rCtx.putImageData(rData, 0, 0);
        this.textures.wallRoughness = new THREE.CanvasTexture(roughCanvas);

        // Floor diffuse with grid
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 2048;
        floorCanvas.height = 2048;
        const fCtx = floorCanvas.getContext('2d');
        fCtx.fillStyle = '#2a2a2a';
        fCtx.fillRect(0, 0, 2048, 2048);
        fCtx.strokeStyle = '#4a4a4a';
        fCtx.lineWidth = 4;
        for (let i = 0; i <= 2048; i += 128) {
            fCtx.beginPath();
            fCtx.moveTo(i, 0);
            fCtx.lineTo(i, 2048);
            fCtx.stroke();
            fCtx.beginPath();
            fCtx.moveTo(0, i);
            fCtx.lineTo(2048, i);
            fCtx.stroke();
        }
        this.textures.floorDiffuse = new THREE.CanvasTexture(floorCanvas);

        // Floor normal (flat)
        const floorNormalCanvas = document.createElement('canvas');
        floorNormalCanvas.width = 2048;
        floorNormalCanvas.height = 2048;
        const fnCtx = floorNormalCanvas.getContext('2d');
        fnCtx.fillStyle = '#8080ff';
        fnCtx.fillRect(0, 0, 2048, 2048);
        this.textures.floorNormal = new THREE.CanvasTexture(floorNormalCanvas);
    }

    generateModels() {
        // Player model with more detail
        const playerGroup = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366ff, emissive: 0x112233, roughness: 0.4, metalness: 0.1 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        body.castShadow = true;
        body.receiveShadow = true;
        playerGroup.add(body);

        const headGeo = new THREE.SphereGeometry(0.4, 24, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, roughness: 0.3 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.7;
        head.castShadow = true;
        playerGroup.add(head);

        // Arms
        const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.9, 8);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x3366ff });
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.7, 1.3, 0);
        leftArm.rotation.z = 0.2;
        leftArm.rotation.x = 0.1;
        leftArm.castShadow = true;
        playerGroup.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.7, 1.3, 0);
        rightArm.rotation.z = -0.2;
        rightArm.rotation.x = -0.1;
        rightArm.castShadow = true;
        playerGroup.add(rightArm);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.9, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x2244aa });
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.3, 0.45, 0);
        leftLeg.castShadow = true;
        playerGroup.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.3, 0.45, 0);
        rightLeg.castShadow = true;
        playerGroup.add(rightLeg);

        this.models.player = playerGroup;

        // Enemy model with multiple parts
        const enemyGroup = new THREE.Group();
        const coreGeo = new THREE.SphereGeometry(0.8, 24, 16);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0x330000 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.castShadow = true;
        core.receiveShadow = true;
        enemyGroup.add(core);

        // Spikes
        for (let i = 0; i < 16; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
            const spikeMat = new THREE.MeshStandardMaterial({ color: 0xaa2200 });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            const angle = (i / 16) * Math.PI * 2;
            spike.position.set(Math.cos(angle) * 1.0, 0, Math.sin(angle) * 1.0);
            spike.rotation.x = Math.PI / 2;
            spike.rotation.z = angle;
            spike.castShadow = true;
            enemyGroup.add(spike);
        }
        // Eye
        const eyeGeo = new THREE.SphereGeometry(0.2, 8);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0.6, 0.3, 0.6);
        enemyGroup.add(eye);
        const pupilGeo = new THREE.SphereGeometry(0.1, 6);
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(0.7, 0.3, 0.7);
        enemyGroup.add(pupil);

        this.models.enemy = enemyGroup;

        // Portal model with animated rings
        const portalGroup = new THREE.Group();
        const ringGeo = new THREE.TorusGeometry(1.5, 0.15, 24, 64);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x004466 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        portalGroup.add(ring);

        const innerRingGeo = new THREE.TorusGeometry(1.2, 0.1, 20, 48);
        const innerRingMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x442200 });
        const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        innerRing.rotation.x = Math.PI / 2;
        innerRing.rotation.z = 0.3;
        innerRing.castShadow = true;
        portalGroup.add(innerRing);

        const innerRing2Geo = new THREE.TorusGeometry(0.9, 0.08, 16, 32);
        const innerRing2Mat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0x331100 });
        const innerRing2 = new THREE.Mesh(innerRing2Geo, innerRing2Mat);
        innerRing2.rotation.x = Math.PI / 2;
        innerRing2.rotation.z = -0.5;
        innerRing2.castShadow = true;
        portalGroup.add(innerRing2);

        this.models.portal = portalGroup;
    }

    generateSounds() {
        if (!this.audioContext) return;

        // Ambient hum with harmonics
        const duration = 4;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 110 * t) * 0.2
                    + Math.sin(2 * Math.PI * 220 * t) * 0.1
                    + Math.sin(2 * Math.PI * 330 * t) * 0.05
                    + (Math.random() * 2 - 1) * 0.01;
        }
        this.sounds.ambient = buffer;

        // Step sound (filtered noise)
        const stepBuffer = this.audioContext.createBuffer(1, sampleRate * 0.15, sampleRate);
        const stepData = stepBuffer.getChannelData(0);
        for (let i = 0; i < stepData.length; i++) {
            stepData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 800);
        }
        this.sounds.step = stepBuffer;

        // Portal sound (sweep)
        const portalBuffer = this.audioContext.createBuffer(1, sampleRate * 2, sampleRate);
        const portalData = portalBuffer.getChannelData(0);
        for (let i = 0; i < portalData.length; i++) {
            const t = i / sampleRate;
            portalData[i] = Math.sin(2 * Math.PI * 220 * t * (1 + t * 2)) * Math.exp(-t * 3);
        }
        this.sounds.portal = portalBuffer;

        // Explosion sound
        const expBuffer = this.audioContext.createBuffer(1, sampleRate * 1.5, sampleRate);
        const expData = expBuffer.getChannelData(0);
        for (let i = 0; i < expData.length; i++) {
            const t = i / sampleRate;
            expData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 5) * Math.sin(2 * Math.PI * 80 * t);
        }
        this.sounds.explosion = expBuffer;
    }

    playSound(name, volume = 0.5, loop = false) {
        if (!this.audioContext || this.audioContext.state !== 'running') return;
        const buffer = this.sounds[name];
        if (!buffer) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode).connect(this.audioContext.destination);
        source.start();
        return source;
    }
}
