import {
    distance,
    getCornerPositions,
    getOppositeCorner,
    getOppositeCornerName,
    rotatePoint
} from '../core/geometry.js';

class TransformController {
    constructor({ pointer, elementRegistry, selectionService, camera, interactionState }) {
        this.pointer = pointer;
        this.elementRegistry = elementRegistry;
        this.selectionService = selectionService;
        this.camera = camera;
        this.interactionState = interactionState;

        this.isDragging = false;
        this.isScaling = false;
        this.isRotating = false;
        this.isEndpointDragging = false;
        this.isBezierDragging = false;
        this.dragStartWorldX = 0;
        this.dragStartWorldY = 0;
        this.scaleCorner = null;
        this.scaleOppositeCorner = null;
        this.initialDistance = 0;
        this.initialGroupStates = [];
        this.isNonUniformRectScale = false;
        this.rectScaleState = null;
        this.rotateCenter = null;
        this.rotateStartAngle = 0;
        this.initialRotationStates = [];
        this.initialGroupRotation = 0;
        this.endpointDragState = null;
        this.bezierDragState = null;

        this.bindEvents();
    }

    bindEvents() {
        this.pointer.on('mousedown', (e) => this.onMouseDown(e));
        this.pointer.on('mousemove', (e) => this.onMouseMove(e));
        this.pointer.on('mouseup', () => this.onMouseUp());
    }

    onMouseDown(e) {
        if (e.button !== 0) return;
        if (e.target && e.target.dataset && e.target.dataset.connectorType) {
            return;
        }
        const worldPos = this.camera.clientToWorld(e.clientX, e.clientY);
        this.dragStartWorldX = worldPos.x;
        this.dragStartWorldY = worldPos.y;

        if (e.target.dataset && e.target.dataset.handleType === 'rotate') {
            this.isRotating = true;
            const selected = this.selectionService.getSelected();
            const bbox = selected.length === 1
                ? selected[0].getBoundingBox()
                : this.selectionService.calculateBoundingBox();
            this.rotateCenter = {
                x: bbox.x + bbox.width / 2,
                y: bbox.y + bbox.height / 2
            };
            this.rotateStartAngle = Math.atan2(worldPos.y - this.rotateCenter.y, worldPos.x - this.rotateCenter.x);
            this.initialGroupRotation = this.selectionService.groupRotation || 0;
            this.initialRotationStates = selected.map(el => {
                const state = {
                    element: el,
                    position: { x: el.position.x, y: el.position.y },
                    rotation: el.rotation
                };
                if (el.type === 'line') {
                    state.x1 = el.x1;
                    state.y1 = el.y1;
                    state.x2 = el.x2;
                    state.y2 = el.y2;
                }
                return state;
            });
            e.preventDefault();
            return;
        }

        if (e.target.dataset && e.target.dataset.handleType === 'bezier-control') {
            const element = this.selectionService.getSelected()[0];
            if (element && element.type === 'connection') {
                this.isBezierDragging = true;
                this.bezierDragState = {
                    element,
                    control: e.target.dataset.control
                };
                e.preventDefault();
                return;
            }
        }

        if (e.target.dataset && e.target.dataset.handleType === 'line-endpoint') {
            const element = this.selectionService.getSelected()[0];
            if (element && element.type === 'line') {
                this.isEndpointDragging = true;
                this.endpointDragState = {
                    element,
                    endpoint: e.target.dataset.endpoint
                };
                e.preventDefault();
                return;
            }
        }

        if (e.target.dataset && e.target.dataset.handleType === 'scale') {
            this.isScaling = true;
            this.scaleCorner = e.target.dataset.corner;
            const selected = this.selectionService.getSelected();
            const bbox = selected.length === 1
                ? selected[0].getBoundingBox()
                : this.selectionService.calculateBoundingBox();
            const isGroup = selected.length > 1;
            const rotationDeg = isGroup
                ? (this.selectionService.groupRotation || 0)
                : (selected[0].rotation || 0);
            const rotationCenter = isGroup
                ? (this.selectionService.groupRotationCenter || { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 })
                : { x: selected[0].position.x, y: selected[0].position.y };

            if (rotationDeg !== 0) {
                const oppositeName = getOppositeCornerName(this.scaleCorner);
                const oppositeCorner = getCornerPositions(bbox)[oppositeName];
                this.scaleOppositeCorner = rotatePoint(
                    oppositeCorner.x,
                    oppositeCorner.y,
                    rotationCenter.x,
                    rotationCenter.y,
                    rotationDeg * Math.PI / 180
                );
            } else {
                this.scaleOppositeCorner = getOppositeCorner(this.scaleCorner, bbox);
            }

            this.initialDistance = distance(worldPos, this.scaleOppositeCorner);
            this.initialGroupStates = selected.map(el => {
                const state = {
                    element: el,
                    position: { x: el.position.x, y: el.position.y },
                    scale: el.scale
                };
                if (el.type === 'line') {
                    state.x1 = el.x1;
                    state.y1 = el.y1;
                    state.x2 = el.x2;
                    state.y2 = el.y2;
                }
                return state;
            });

            const singleElement = selected.length === 1
                ? selected[0]
                : null;
            this.isNonUniformRectScale = !!singleElement
                && (singleElement.type === 'rectangle' || singleElement.type === 'node');
            if (this.isNonUniformRectScale) {
                const cornerPositions = getCornerPositions(bbox);
                const handleCorner = cornerPositions[this.scaleCorner];
                const oppositeCorner = cornerPositions[getOppositeCornerName(this.scaleCorner)];
                const rotationRad = rotationDeg * Math.PI / 180;
                const handleWorld = rotationDeg !== 0
                    ? rotatePoint(
                        handleCorner.x,
                        handleCorner.y,
                        rotationCenter.x,
                        rotationCenter.y,
                        rotationRad
                    )
                    : { x: handleCorner.x, y: handleCorner.y };
                const oppositeWorld = rotationDeg !== 0
                    ? rotatePoint(
                        oppositeCorner.x,
                        oppositeCorner.y,
                        rotationCenter.x,
                        rotationCenter.y,
                        rotationRad
                    )
                    : { x: oppositeCorner.x, y: oppositeCorner.y };
                this.rectScaleState = {
                    element: singleElement,
                    rotationCenter: { x: rotationCenter.x, y: rotationCenter.y },
                    rotationRad,
                    handleWorld,
                    oppositeWorld
                };
            } else {
                this.rectScaleState = null;
            }
            e.preventDefault();
            return;
        }

        let clickedElement = null;
        for (const element of this.elementRegistry.getAll()) {
            if (element.isHitTarget && element.isHitTarget(e.target)) {
                clickedElement = element;
                break;
            }
        }
        if (clickedElement) {
            if (!this.selectionService.getSelected().includes(clickedElement)) {
                this.selectionService.selectElement(clickedElement, e.shiftKey);
            }
            this.isDragging = true;
            this.interactionState.dragOccurred = false;
            e.preventDefault();
        }
    }

    onMouseMove(e) {
        if (this.isBezierDragging && this.bezierDragState) {
            const currentWorld = this.camera.clientToWorld(e.clientX, e.clientY);
            const { element, control } = this.bezierDragState;
            element.setControlPoint(control, currentWorld);
            element.update();
            if (element.selected) {
                element.renderHandles();
            }
            this.interactionState.dragOccurred = true;
            e.preventDefault();
            return;
        }

        if (this.isEndpointDragging && this.endpointDragState) {
            const currentWorld = this.camera.clientToWorld(e.clientX, e.clientY);
            const { element, endpoint } = this.endpointDragState;
            if (endpoint === 'start') {
                element.x1 = currentWorld.x;
                element.y1 = currentWorld.y;
            } else {
                element.x2 = currentWorld.x;
                element.y2 = currentWorld.y;
            }
            element.position.x = (element.x1 + element.x2) / 2;
            element.position.y = (element.y1 + element.y2) / 2;
            element.updateSvgPosition();
            this.selectionService.updateHandles();
            this.interactionState.dragOccurred = true;
            e.preventDefault();
            return;
        }

        if (this.isScaling) {
            const currentWorld = this.camera.clientToWorld(e.clientX, e.clientY);
            if (this.isNonUniformRectScale && this.rectScaleState) {
                const { element, rotationCenter, rotationRad, oppositeWorld } = this.rectScaleState;
                const localOpposite = rotationRad !== 0
                    ? rotatePoint(
                        oppositeWorld.x,
                        oppositeWorld.y,
                        rotationCenter.x,
                        rotationCenter.y,
                        -rotationRad
                    )
                    : { x: oppositeWorld.x, y: oppositeWorld.y };
                const localCurrent = rotationRad !== 0
                    ? rotatePoint(
                        currentWorld.x,
                        currentWorld.y,
                        rotationCenter.x,
                        rotationCenter.y,
                        -rotationRad
                    )
                    : { x: currentWorld.x, y: currentWorld.y };
                const newWidth = Math.max(1, Math.abs(localCurrent.x - localOpposite.x));
                const newHeight = Math.max(1, Math.abs(localCurrent.y - localOpposite.y));
                const localCenter = {
                    x: (localCurrent.x + localOpposite.x) / 2,
                    y: (localCurrent.y + localOpposite.y) / 2
                };
                const worldCenter = rotationRad !== 0
                    ? rotatePoint(
                        localCenter.x,
                        localCenter.y,
                        rotationCenter.x,
                        rotationCenter.y,
                        rotationRad
                    )
                    : localCenter;
                element.width = newWidth;
                element.height = newHeight;
                element.scale = 1;
                element.position.x = worldCenter.x;
                element.position.y = worldCenter.y;
                element.updateSvgScale();
            } else {
                const currentDistance = distance(currentWorld, this.scaleOppositeCorner);
                const factor = currentDistance / this.initialDistance;
                this.initialGroupStates.forEach(state => {
                    const element = state.element;
                    if (element.type === 'line') {
                        element.x1 = this.scaleOppositeCorner.x + (state.x1 - this.scaleOppositeCorner.x) * factor;
                        element.y1 = this.scaleOppositeCorner.y + (state.y1 - this.scaleOppositeCorner.y) * factor;
                        element.x2 = this.scaleOppositeCorner.x + (state.x2 - this.scaleOppositeCorner.x) * factor;
                        element.y2 = this.scaleOppositeCorner.y + (state.y2 - this.scaleOppositeCorner.y) * factor;
                        element.position.x = (element.x1 + element.x2) / 2;
                        element.position.y = (element.y1 + element.y2) / 2;
                        element.updateSvgPosition();
                    } else {
                        element.scale = state.scale * factor;
                        element.position.x = this.scaleOppositeCorner.x + (state.position.x - this.scaleOppositeCorner.x) * factor;
                        element.position.y = this.scaleOppositeCorner.y + (state.position.y - this.scaleOppositeCorner.y) * factor;
                        element.updateSvgScale();
                    }
                });
            }
            this.selectionService.updateHandles();
            e.preventDefault();
            return;
        }

        if (this.isRotating) {
            const currentWorld = this.camera.clientToWorld(e.clientX, e.clientY);
            const currentAngle = Math.atan2(currentWorld.y - this.rotateCenter.y, currentWorld.x - this.rotateCenter.x);
            const deltaAngle = currentAngle - this.rotateStartAngle;
            const deltaDeg = deltaAngle * 180 / Math.PI;
            if (this.selectionService.getSelected().length > 1) {
                this.selectionService.groupRotation = this.initialGroupRotation + deltaDeg;
                this.selectionService.groupRotationCenter = this.rotateCenter;
            }
            this.initialRotationStates.forEach(state => {
                const element = state.element;
                if (element.type === 'line') {
                    const p1 = rotatePoint(state.x1, state.y1, this.rotateCenter.x, this.rotateCenter.y, deltaAngle);
                    const p2 = rotatePoint(state.x2, state.y2, this.rotateCenter.x, this.rotateCenter.y, deltaAngle);
                    element.x1 = p1.x;
                    element.y1 = p1.y;
                    element.x2 = p2.x;
                    element.y2 = p2.y;
                    element.position.x = (element.x1 + element.x2) / 2;
                    element.position.y = (element.y1 + element.y2) / 2;
                    element.rotation = state.rotation + deltaDeg;
                    element.updateSvgPosition();
                } else {
                    const pos = rotatePoint(state.position.x, state.position.y, this.rotateCenter.x, this.rotateCenter.y, deltaAngle);
                    element.position.x = pos.x;
                    element.position.y = pos.y;
                    element.rotation = state.rotation + deltaDeg;
                    element.updateSvgPosition();
                    element.updateSvgRotation();
                }
            });
            this.selectionService.updateHandles();
            e.preventDefault();
            return;
        }

        if (this.isDragging) {
            const currentWorld = this.camera.clientToWorld(e.clientX, e.clientY);
            const deltaX = currentWorld.x - this.dragStartWorldX;
            const deltaY = currentWorld.y - this.dragStartWorldY;
            this.selectionService.getSelected().forEach(element => {
                element.move(deltaX, deltaY);
            });
            this.dragStartWorldX = currentWorld.x;
            this.dragStartWorldY = currentWorld.y;
            this.interactionState.dragOccurred = true;
            this.selectionService.updateHandles();
            e.preventDefault();
        }
    }

    onMouseUp() {
        const wasHandleDrag = this.isBezierDragging || this.isEndpointDragging || this.isScaling || this.isRotating;
        if (this.isBezierDragging) {
            this.isBezierDragging = false;
            this.bezierDragState = null;
            this.selectionService.updateHandles();
        }
        if (this.isEndpointDragging) {
            this.isEndpointDragging = false;
            this.endpointDragState = null;
            this.selectionService.updateHandles();
        }
        if (this.isScaling) {
            this.isScaling = false;
            this.isNonUniformRectScale = false;
            this.rectScaleState = null;
            this.selectionService.updateHandles();
        }
        if (this.isRotating) {
            this.isRotating = false;
            this.selectionService.updateHandles();
        }
        if (this.isDragging) {
            this.isDragging = false;
            this.selectionService.updateHandles();
        }
        if (wasHandleDrag) {
            this.interactionState.dragOccurred = false;
        }
    }
}

export default TransformController;
