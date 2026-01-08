class PointerInputAdapter {
    constructor({ viewportEl }) {
        this.viewportEl = viewportEl;
        this.handlers = new Map();
    }

    on(type, handler, options) {
        if (!this.viewportEl) return;
        const wrapped = (event) => handler(event);
        this.viewportEl.addEventListener(type, wrapped, options);
        this.handlers.set(handler, { type, wrapped, options });
    }

    off(handler) {
        const entry = this.handlers.get(handler);
        if (!entry || !this.viewportEl) return;
        this.viewportEl.removeEventListener(entry.type, entry.wrapped, entry.options);
        this.handlers.delete(handler);
    }

    destroy() {
        if (!this.viewportEl) return;
        this.handlers.forEach(({ type, wrapped, options }) => {
            this.viewportEl.removeEventListener(type, wrapped, options);
        });
        this.handlers.clear();
    }
}

export default PointerInputAdapter;
