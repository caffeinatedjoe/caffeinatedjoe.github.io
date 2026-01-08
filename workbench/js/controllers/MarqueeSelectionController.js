class MarqueeSelectionController {
    constructor({ pointer, world, elementRegistry, selectionService, camera, interactionState }) {
        this.pointer = pointer;
        this.world = world;
        this.elementRegistry = elementRegistry;
        this.selectionService = selectionService;
        this.camera = camera;
        this.interactionState = interactionState;
        this.isSelecting = false;
        this.pending = false;
        this.dragThreshold = 6;
        this.startWorld = null;
        this.startClient = null;
        this.currentWorld = null;
        this.isAdditive = false;
        this.baseSelection = [];
        this.marqueeRect = null;
        this.onMouseMove = (e) => this.handleMouseMove(e);
        this.onMouseUp = (e) => this.handleMouseUp(e);
        this.bindEvents();
    }

    bindEvents() {
        this.pointer.on('mousedown', (e) => this.onMouseDown(e));
    }

    onMouseDown(e) {
        if (e.button !== 0) return;
        if (this.isHandleTarget(e.target) || this.isElementTarget(e.target)) return;
        this.pending = true;
        this.startClient = { x: e.clientX, y: e.clientY };
        this.startWorld = this.camera.clientToWorld(e.clientX, e.clientY);
        this.currentWorld = { ...this.startWorld };
        this.isAdditive = e.shiftKey;
        this.baseSelection = e.shiftKey ? [...this.selectionService.getSelected()] : [];
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
    }

    handleMouseMove(e) {
        if (!this.pending && !this.isSelecting) return;
        if (!this.isSelecting) {
            const dx = e.clientX - this.startClient.x;
            const dy = e.clientY - this.startClient.y;
            if (Math.hypot(dx, dy) < this.dragThreshold) {
                return;
            }
            this.isSelecting = true;
            this.interactionState.dragOccurred = true;
            this.ensureMarqueeRect();
        }
        e.preventDefault();
        this.currentWorld = this.camera.clientToWorld(e.clientX, e.clientY);
        this.updateMarqueeRect();
        this.updateSelection();
    }

    handleMouseUp(e) {
        if (e.button !== 0) return;
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        if (this.isSelecting) {
            e.preventDefault();
            this.hideMarqueeRect();
        }
        this.isSelecting = false;
        this.pending = false;
        this.startWorld = null;
        this.startClient = null;
        this.currentWorld = null;
        this.isAdditive = false;
        this.baseSelection = [];
    }

    isHandleTarget(target) {
        return !!(target && target.dataset && target.dataset.handleType);
    }

    isElementTarget(target) {
        return this.elementRegistry.getAll().some(element => (
            target === element.svgElement || element.svgElement.contains(target)
        ));
    }

    ensureMarqueeRect() {
        if (this.marqueeRect) {
            this.marqueeRect.style.display = 'block';
            return;
        }
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.classList.add('marquee-rect');
        rect.setAttribute('x', this.startWorld.x);
        rect.setAttribute('y', this.startWorld.y);
        rect.setAttribute('width', 0);
        rect.setAttribute('height', 0);
        this.world.appendChild(rect);
        this.marqueeRect = rect;
    }

    hideMarqueeRect() {
        if (!this.marqueeRect) return;
        this.marqueeRect.style.display = 'none';
    }

    updateMarqueeRect() {
        if (!this.marqueeRect || !this.startWorld || !this.currentWorld) return;
        const rect = this.getRectFromPoints(this.startWorld, this.currentWorld);
        this.marqueeRect.setAttribute('x', rect.x);
        this.marqueeRect.setAttribute('y', rect.y);
        this.marqueeRect.setAttribute('width', rect.width);
        this.marqueeRect.setAttribute('height', rect.height);
    }

    updateSelection() {
        if (!this.startWorld || !this.currentWorld) return;
        const rect = this.getRectFromPoints(this.startWorld, this.currentWorld);
        const inRect = this.elementRegistry.getAll().filter(element => (
            this.isElementInRect(element, rect)
        ));
        if (this.isAdditive) {
            const merged = new Set([...this.baseSelection, ...inRect]);
            this.selectionService.setSelection(Array.from(merged));
            return;
        }
        this.selectionService.setSelection(inRect);
    }

    getRectFromPoints(a, b) {
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const width = Math.abs(a.x - b.x);
        const height = Math.abs(a.y - b.y);
        return { x, y, width, height };
    }

    isElementInRect(element, rect) {
        const bbox = this.selectionService.getElementBoundingBox(element);
        if (!bbox) return false;
        const rectRight = rect.x + rect.width;
        const rectBottom = rect.y + rect.height;
        const boxRight = bbox.x + bbox.width;
        const boxBottom = bbox.y + bbox.height;
        return (
            bbox.x <= rectRight &&
            boxRight >= rect.x &&
            bbox.y <= rectBottom &&
            boxBottom >= rect.y
        );
    }
}

export default MarqueeSelectionController;
