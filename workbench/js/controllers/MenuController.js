class MenuController {
    constructor({ pointer, camera, menu, onContext, overlayContainer }) {
        this.pointer = pointer;
        this.camera = camera;
        this.menu = menu;
        this.onContext = onContext;
        this.overlayContainer = overlayContainer || (menu && typeof menu.getContainer === 'function'
            ? menu.getContainer()
            : document.body);
        this.isTracking = false;
        this.activeSectionId = null;
        this.lineOverlay = null;
        this.lineElement = null;
        this.dragStart = null;
        this.dragged = false;
        this.dragThreshold = 6;
        this.onMouseMove = (e) => this.handleMouseMove(e);
        this.onMouseUp = (e) => this.handleMouseUp(e);
        this.bindEvents();
    }

    bindEvents() {
        this.pointer.on('contextmenu', (e) => e.preventDefault());
        this.pointer.on('mousedown', (e) => this.onMouseDown(e));
    }

    onMouseDown(e) {
        if (e.button !== 2) return;
        e.preventDefault();
        const world = this.camera.clientToWorld(e.clientX, e.clientY);
        if (this.onContext) {
            this.onContext(world);
        }
        this.menu.openAt(e.clientX, e.clientY);
        this.isTracking = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.dragged = false;
        this.ensureLineOverlay();
        this.updateLine(e.clientX, e.clientY);
        this.updateSelectionFromPointer(e.clientX, e.clientY);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
    }

    handleMouseMove(e) {
        if (!this.isTracking) return;
        if (!this.dragged && this.dragStart) {
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            if (Math.hypot(dx, dy) >= this.dragThreshold) {
                this.dragged = true;
            }
        }
        this.updateLine(e.clientX, e.clientY);
        this.updateSelectionFromPointer(e.clientX, e.clientY);
    }

    handleMouseUp(e) {
        if (!this.isTracking || e.button !== 2) return;
        this.isTracking = false;
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        this.hideLineOverlay();
        if (this.dragged && this.activeSectionId) {
            this.menu.triggerSectionById(this.activeSectionId);
        }
        this.activeSectionId = null;
        this.dragStart = null;
        this.dragged = false;
    }

    updateSelectionFromPointer(x, y) {
        const center = this.menu.getCenter();
        if (!center) return;
        const dx = x - center.x;
        const dy = y - center.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= this.menu.getInnerRadius()) {
            this.activeSectionId = null;
            this.menu.clearActiveSection();
            return;
        }
        const angle = Math.atan2(dy, dx);
        const section = this.menu.getSectionForAngle(angle);
        const sectionId = section ? section.id : null;
        this.activeSectionId = sectionId;
        this.menu.setActiveSection(sectionId);
    }

    ensureLineOverlay() {
        if (this.lineOverlay) {
            this.updateLineOverlaySize();
            this.lineOverlay.style.display = 'block';
            return;
        }
        const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        overlay.classList.add('radial-menu-line-overlay');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('radial-menu-line');
        overlay.appendChild(line);
        this.overlayContainer.appendChild(overlay);
        this.lineOverlay = overlay;
        this.lineElement = line;
        this.updateLineOverlaySize();
        this.lineOverlay.style.display = 'block';
    }

    updateLineOverlaySize() {
        if (!this.lineOverlay) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.lineOverlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    updateLine(x, y) {
        if (!this.lineElement) return;
        const center = this.menu.getCenter();
        if (!center) return;
        this.lineElement.setAttribute('x1', center.x);
        this.lineElement.setAttribute('y1', center.y);
        this.lineElement.setAttribute('x2', x);
        this.lineElement.setAttribute('y2', y);
    }

    hideLineOverlay() {
        if (!this.lineOverlay) return;
        this.lineOverlay.style.display = 'none';
    }
}

export default MenuController;
