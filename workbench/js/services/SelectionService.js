import { rotatePoint } from '../core/geometry.js';

class SelectionService {
    constructor({ elementRegistry, handleRenderer }) {
        this.elementRegistry = elementRegistry;
        this.handleRenderer = handleRenderer;
        this.selectedElements = [];
        this.groupRotation = 0;
        this.groupRotationCenter = null;
    }

    selectElement(element, shiftKey = false) {
        const wasSelected = this.selectedElements.includes(element);
        if (!shiftKey) {
            this.deselectAll();
        }
        if (wasSelected && shiftKey) {
            this.deselectElement(element);
        } else if (!wasSelected) {
            this.selectedElements.push(element);
            element.select();
        }
        this.groupRotation = 0;
        this.groupRotationCenter = null;
        this.updateHandles();
    }

    deselectElement(element) {
        const index = this.selectedElements.indexOf(element);
        if (index > -1) {
            this.selectedElements.splice(index, 1);
            element.deselect();
            this.groupRotation = 0;
            this.groupRotationCenter = null;
            this.updateHandles();
        }
    }

    deselectAll() {
        this.removeIndividualHandles();
        this.handleRenderer.removeGroupHandles();
        this.selectedElements.forEach(element => element.deselect());
        this.selectedElements = [];
        this.groupRotation = 0;
        this.groupRotationCenter = null;
    }

    setSelection(elements) {
        this.deselectAll();
        this.selectedElements = [];
        elements.forEach(element => {
            if (!element) return;
            element.selected = true;
            this.selectedElements.push(element);
        });
        this.groupRotation = 0;
        this.groupRotationCenter = null;
        this.updateHandles();
    }

    getSelected() {
        return this.selectedElements;
    }

    handleClick(event, shiftKey = false) {
        let targetElement = null;
        const elements = this.elementRegistry.getAll();
        for (const element of elements) {
            if (element.isHitTarget && element.isHitTarget(event.target)) {
                targetElement = element;
                break;
            }
        }
        if (targetElement) {
            this.selectElement(targetElement, shiftKey);
        } else {
            this.deselectAll();
        }
    }

    updateHandles() {
        if (this.selectedElements.length > 1) {
            this.removeIndividualHandles();
            const bbox = this.calculateBoundingBox();
            this.handleRenderer.renderGroupHandles({
                bbox,
                groupRotation: this.groupRotation,
                groupRotationCenter: this.groupRotationCenter
            });
        } else if (this.selectedElements.length === 1) {
            this.handleRenderer.removeGroupHandles();
            this.selectedElements[0].renderHandles();
        } else {
            this.removeIndividualHandles();
            this.handleRenderer.removeGroupHandles();
            this.groupRotation = 0;
            this.groupRotationCenter = null;
        }
    }

    removeIndividualHandles() {
        this.selectedElements.forEach(element => element.removeHandles());
    }

    getElementBoundingBox(element) {
        const bbox = element.getBoundingBox();
        if (!bbox) return null;
        if (!element.rotation || element.rotation === 0 || (element.type !== 'rectangle' && element.type !== 'node')) {
            return bbox;
        }
        const centerX = element.position.x;
        const centerY = element.position.y;
        const rad = element.rotation * Math.PI / 180;
        const corners = [
            { x: bbox.x, y: bbox.y },
            { x: bbox.x + bbox.width, y: bbox.y },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
            { x: bbox.x, y: bbox.y + bbox.height }
        ].map(point => rotatePoint(point.x, point.y, centerX, centerY, rad));
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        corners.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    getGroupLocalBoundingBox() {
        const center = this.groupRotationCenter;
        if (!center) return null;
        const invRad = -this.groupRotation * Math.PI / 180;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        this.selectedElements.forEach(element => {
            if (element.type === 'circle') {
                const localCenter = rotatePoint(element.position.x, element.position.y, center.x, center.y, invRad);
                const r = element.r * element.scale;
                minX = Math.min(minX, localCenter.x - r);
                minY = Math.min(minY, localCenter.y - r);
                maxX = Math.max(maxX, localCenter.x + r);
                maxY = Math.max(maxY, localCenter.y + r);
                return;
            }

            if (element.type === 'line') {
                const p1 = rotatePoint(element.x1, element.y1, center.x, center.y, invRad);
                const p2 = rotatePoint(element.x2, element.y2, center.x, center.y, invRad);
                minX = Math.min(minX, p1.x, p2.x);
                minY = Math.min(minY, p1.y, p2.y);
                maxX = Math.max(maxX, p1.x, p2.x);
                maxY = Math.max(maxY, p1.y, p2.y);
                return;
            }

            if (element.type === 'rectangle' || element.type === 'node') {
                const halfW = (element.width * element.scale) / 2;
                const halfH = (element.height * element.scale) / 2;
                const rotationRad = (element.rotation || 0) * Math.PI / 180;
                const cos = Math.cos(rotationRad);
                const sin = Math.sin(rotationRad);
                const corners = [
                    { x: -halfW, y: -halfH },
                    { x: halfW, y: -halfH },
                    { x: halfW, y: halfH },
                    { x: -halfW, y: halfH }
                ];
                corners.forEach(offset => {
                    const worldX = element.position.x + offset.x * cos - offset.y * sin;
                    const worldY = element.position.y + offset.x * sin + offset.y * cos;
                    const local = rotatePoint(worldX, worldY, center.x, center.y, invRad);
                    minX = Math.min(minX, local.x);
                    minY = Math.min(minY, local.y);
                    maxX = Math.max(maxX, local.x);
                    maxY = Math.max(maxY, local.y);
                });
                return;
            }

            const bbox = this.getElementBoundingBox(element);
            if (!bbox) return;
            const corners = [
                { x: bbox.x, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
                { x: bbox.x, y: bbox.y + bbox.height }
            ];
            corners.forEach(point => {
                const local = rotatePoint(point.x, point.y, center.x, center.y, invRad);
                minX = Math.min(minX, local.x);
                minY = Math.min(minY, local.y);
                maxX = Math.max(maxX, local.x);
                maxY = Math.max(maxY, local.y);
            });
        });

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            return null;
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    calculateBoundingBox() {
        if (this.selectedElements.length === 0) return null;
        if (this.selectedElements.length > 1 && this.groupRotation !== 0 && this.groupRotationCenter) {
            const rotatedBox = this.getGroupLocalBoundingBox();
            if (rotatedBox) return rotatedBox;
        }
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        this.selectedElements.forEach(element => {
            const bbox = this.getElementBoundingBox(element);
            if (!bbox) return;
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.width);
            maxY = Math.max(maxY, bbox.y + bbox.height);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
}

export default SelectionService;
