class ZoomController {
    constructor({ pointer, camera, menu }) {
        this.pointer = pointer;
        this.camera = camera;
        this.menu = menu;
        this.bindEvents();
    }

    bindEvents() {
        this.pointer.on('wheel', (e) => this.onWheel(e), { passive: false });
    }

    onWheel(e) {
        e.preventDefault();
        if (this.menu) {
            this.menu.close();
        }
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.camera.zoomAt(e.clientX, e.clientY, zoomFactor);
    }
}

export default ZoomController;
