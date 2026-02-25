import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ShaderManager } from '../graphics/ShaderManager.js';
import { PostProcessor } from '../graphics/PostProcessor.js';
import { ParticleSystem } from '../graphics/ParticleSystem.js';
import { WaterEffect } from '../graphics/WaterEffect.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111122);
        this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            powerPreference: "high-performance",
            stencil: true,
            depth: true
        });
        this.shaderManager = new ShaderManager();
        this.postProcessor = new PostProcessor(this.renderer, this.scene, this.camera);
        this.particleSystem = new ParticleSystem(this.scene);
        this.waterEffect = new WaterEffect(this.scene);
        
        this.ambientLight = new THREE.AmbientLight(0x404060);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.pointLights = [];
        this.fog = new THREE.FogExp2(0x111122, 0.02);
    }

    init(assets) {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        document.body.appendChild(this.renderer.domElement);

        // Camera
        this.camera.position.set(0, 2, 5);

        // Lighting
        this.ambientLight.intensity = 0.4;
        this.scene.add(this.ambientLight);

        this.directionalLight.position.set(5, 15, 7);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 4096;
        this.directionalLight.shadow.mapSize.height = 4096;
        const d = 30;
        this.directionalLight.shadow.camera.left = -d;
        this.directionalLight.shadow.camera.right = d;
        this.directionalLight.shadow.camera.top = d;
        this.directionalLight.shadow.camera.bottom = -d;
        this.directionalLight.shadow.camera.near = 1;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.bias = -0.0005;
        this.scene.add(this.directionalLight);

        // Fill lights
        for (let i = 0; i < 6; i++) {
            const color = new THREE.Color().setHSL(i / 6, 0.5, 0.5);
            const light = new THREE.PointLight(color, 0.8, 20);
            light.position.set(Math.sin(i) * 8, 2 + i, Math.cos(i) * 8);
            this.scene.add(light);
            this.pointLights.push(light);
        }

        // Fog
        this.scene.fog = this.fog;

        // Initialize shaders and post-processing
        this.shaderManager.init();
        this.postProcessor.init();
        this.waterEffect.init();

        // Skybox with stars
        this.createStarfield();
    }

    createStarfield() {
        const vertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            vertices.push(x, y, z);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    update(deltaTime) {
        // Update particle systems
        this.particleSystem.update(deltaTime);

        // Animate point lights
        this.pointLights.forEach((light, i) => {
            light.position.x = Math.sin(performance.now() * 0.001 + i) * 10;
            light.position.z = Math.cos(performance.now() * 0.001 + i) * 10;
            light.position.y = 3 + Math.sin(performance.now() * 0.002 + i) * 2;
        });

        // Update water
        this.waterEffect.update(deltaTime);

        // Render via post-processor
        this.postProcessor.render(deltaTime);
    }

    addToScene(object) {
        this.scene.add(object);
    }

    removeFromScene(object) {
        this.scene.remove(object);
    }
}
