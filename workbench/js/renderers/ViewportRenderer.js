class ViewportRenderer {
    constructor({ viewportEl, rasterLayerEl, worldEl }) {
        this.viewportEl = viewportEl;
        this.rasterLayerEl = rasterLayerEl;
        this.worldEl = worldEl;
        this.ctx = rasterLayerEl ? rasterLayerEl.getContext('2d') : null;
    }

    resize(state) {
        if (!this.viewportEl) return;
        if (this.rasterLayerEl && this.ctx) {
            this.rasterLayerEl.width = this.viewportEl.clientWidth;
            this.rasterLayerEl.height = this.viewportEl.clientHeight;
        }
        this.apply(state);
    }

    apply(state) {
        if (!state || !this.worldEl || !this.viewportEl) return;
        this.worldEl.setAttribute(
            'transform',
            `translate(${state.offsetX}, ${state.offsetY}) scale(${state.scale})`
        );
        if (this.ctx) {
            this.ctx.setTransform(state.scale, 0, 0, state.scale, state.offsetX, state.offsetY);
            this.ctx.clearRect(
                -state.offsetX / state.scale,
                -state.offsetY / state.scale,
                this.viewportEl.clientWidth / state.scale,
                this.viewportEl.clientHeight / state.scale
            );
        }
    }

    clientToWorld(state, clientX, clientY) {
        if (!this.viewportEl || !state) {
            return { x: 0, y: 0 };
        }
        const rect = this.viewportEl.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        return {
            x: (px - state.offsetX) / state.scale,
            y: (py - state.offsetY) / state.scale
        };
    }
}

export default ViewportRenderer;
