class KeyboardInputAdapter {
    constructor({ target }) {
        this.target = target;
        this.handlers = new Map();
    }

    on(type, handler, options) {
        if (!this.target) return;
        const wrapped = (event) => handler(event);
        this.target.addEventListener(type, wrapped, options);
        this.handlers.set(handler, { type, wrapped, options });
    }

    off(handler) {
        const entry = this.handlers.get(handler);
        if (!entry || !this.target) return;
        this.target.removeEventListener(entry.type, entry.wrapped, entry.options);
        this.handlers.delete(handler);
    }

    destroy() {
        if (!this.target) return;
        this.handlers.forEach(({ type, wrapped, options }) => {
            this.target.removeEventListener(type, wrapped, options);
        });
        this.handlers.clear();
    }
}

export default KeyboardInputAdapter;
