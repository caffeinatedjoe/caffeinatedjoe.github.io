class PanningController {
    constructor({ pointer, camera, menu }) {
        this.pointer = pointer;
        this.camera = camera;
        this.menu = menu;
        this.isPanning = false;
        this.lastX = 0;
        this.lastY = 0;
        this.bindEvents();
    }

    bindEvents() {
        this.pointer.on('mousedown', (e) => this.onMouseDown(e));
        this.pointer.on('mousemove', (e) => this.onMouseMove(e));
        this.pointer.on('mouseup', () => this.onMouseUp());
    }

    onMouseDown(e) {
        if (e.button !== 1) return;
        e.preventDefault();
        if (this.menu) {
            this.menu.close();
        }
        this.isPanning = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    onMouseMove(e) {
        if (!this.isPanning) return;
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        this.camera.pan(dx, dy);
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    onMouseUp() {
        this.isPanning = false;
    }
}

export default PanningController;
