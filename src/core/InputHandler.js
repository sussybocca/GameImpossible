export class InputHandler {
    constructor() {
        this.keys = {};
        this.keyDownCallbacks = new Map();
        this.keyUpCallbacks = new Map();
        this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0, left: false, right: false, wheel: 0 };
        this.pointerLocked = false;
    }

    init() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('wheel', (e) => this.onWheel(e));
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('mozpointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('webkitpointerlockchange', () => this.onPointerLockChange());

        document.body.addEventListener('click', () => {
            if (!this.pointerLocked) {
                document.body.requestPointerLock();
            }
        });
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        if (this.keyDownCallbacks.has(e.code)) {
            this.keyDownCallbacks.get(e.code).forEach(cb => cb());
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
        if (this.keyUpCallbacks.has(e.code)) {
            this.keyUpCallbacks.get(e.code).forEach(cb => cb());
        }
    }

    onMouseMove(e) {
        if (this.pointerLocked) {
            this.mouse.deltaX = e.movementX;
            this.mouse.deltaY = e.movementY;
        }
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    onMouseDown(e) {
        if (e.button === 0) this.mouse.left = true;
        if (e.button === 2) this.mouse.right = true;
    }

    onMouseUp(e) {
        if (e.button === 0) this.mouse.left = false;
        if (e.button === 2) this.mouse.right = false;
    }

    onWheel(e) {
        this.mouse.wheel = e.deltaY;
    }

    onPointerLockChange() {
        this.pointerLocked = document.pointerLockElement === document.body;
    }

    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    getMouseDelta() {
        const delta = { x: this.mouse.deltaX, y: this.mouse.deltaY };
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        return delta;
    }

    registerAction(keyCode, callback, onDown = true) {
        const map = onDown ? this.keyDownCallbacks : this.keyUpCallbacks;
        if (!map.has(keyCode)) map.set(keyCode, []);
        map.get(keyCode).push(callback);
    }

    unregisterAction(keyCode, callback) {
        [this.keyDownCallbacks, this.keyUpCallbacks].forEach(map => {
            if (map.has(keyCode)) {
                const arr = map.get(keyCode);
                const idx = arr.indexOf(callback);
                if (idx !== -1) arr.splice(idx, 1);
            }
        });
    }
}
