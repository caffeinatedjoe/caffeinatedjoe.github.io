class CameraController {
    constructor({ state, renderer }) {
        this.state = state;
        this.renderer = renderer;
        this.renderer.apply(this.state);
    }

    resize() {
        this.renderer.resize(this.state);
    }

    pan(dx, dy) {
        this.state.offsetX += dx;
        this.state.offsetY += dy;
        this.renderer.apply(this.state);
    }

    zoomAt(clientX, clientY, factor) {
        if (!this.renderer.viewportEl) return;
        const rect = this.renderer.viewportEl.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const worldX = (px - this.state.offsetX) / this.state.scale;
        const worldY = (py - this.state.offsetY) / this.state.scale;
        this.state.scale *= factor;
        this.state.offsetX = px - worldX * this.state.scale;
        this.state.offsetY = py - worldY * this.state.scale;
        this.renderer.apply(this.state);
    }

    clientToWorld(clientX, clientY) {
        return this.renderer.clientToWorld(this.state, clientX, clientY);
    }
}

export default CameraController;
