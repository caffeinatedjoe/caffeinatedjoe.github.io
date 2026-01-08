import ConnectionElement from '../elements/ConnectionElement.js';

class NodeConnectionController {
    constructor({ pointer, world, camera, elementRegistry, selectionService, onChange }) {
        this.pointer = pointer;
        this.world = world;
        this.camera = camera;
        this.elementRegistry = elementRegistry;
        this.selectionService = selectionService;
        this.onChange = onChange;
        this.isConnecting = false;
        this.pendingConnector = null;
        this.startNode = null;
        this.startType = null;
        this.startIndex = null;
        this.previewLine = null;
        this.connectionId = 0;
        this.selectedConnector = null;
        this.dragThreshold = 4;
        this.onMouseMove = (e) => this.handleMouseMove(e);
        this.onMouseUp = (e) => this.handleMouseUp(e);
        this.onKeyDown = (e) => this.handleKeyDown(e);
        this.bindEvents();
    }

    bindEvents() {
        this.pointer.on('mousedown', (e) => this.handleMouseDown(e), true);
        document.addEventListener('keydown', this.onKeyDown);
    }

    handleMouseDown(e) {
        const connector = this.getConnectorFromEventTarget(e.target);
        if (!connector) {
            this.clearSelectedConnector();
            return;
        }
        const node = this.elementRegistry.getById(connector.nodeId);
        if (!node || node.type !== 'node') return;

        const isSelected = this.isConnectorSelected(connector);

        e.preventDefault();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        } else {
            e.stopPropagation();
        }

        if (isSelected) {
            return;
        }

        this.pendingConnector = {
            node,
            type: connector.type,
            index: connector.index,
            clientX: e.clientX,
            clientY: e.clientY
        };

        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
    }

    handleMouseMove(e) {
        if (this.isConnecting) {
            this.updatePreviewLine(e.clientX, e.clientY);
            e.preventDefault();
            return;
        }
        if (!this.pendingConnector) return;
        const dx = e.clientX - this.pendingConnector.clientX;
        const dy = e.clientY - this.pendingConnector.clientY;
        if (Math.hypot(dx, dy) < this.dragThreshold) return;
        this.isConnecting = true;
        this.startNode = this.pendingConnector.node;
        this.startType = this.pendingConnector.type;
        this.startIndex = this.pendingConnector.index;
        this.pendingConnector = null;
        this.ensurePreviewLine();
        this.updatePreviewLine(e.clientX, e.clientY);
        e.preventDefault();
    }

    handleMouseUp(e) {
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);

        if (!this.isConnecting) {
            if (this.pendingConnector) {
                this.selectConnector(this.pendingConnector);
                this.pendingConnector = null;
            }
            return;
        }

        const endConnector = this.getConnectorFromEventTarget(e.target);
        if (endConnector) {
            const endNode = this.elementRegistry.getById(endConnector.nodeId);
            if (endNode && endNode.type === 'node' && endNode !== this.startNode) {
                this.createConnection(endNode, endConnector);
            }
        }

        this.cleanupPreview();
        this.isConnecting = false;
        this.startNode = null;
        this.startType = null;
        this.startIndex = null;
    }

    getConnectorFromEventTarget(target) {
        if (!target || !target.dataset || !target.dataset.connectorType) {
            return null;
        }
        return {
            type: target.dataset.connectorType,
            index: Number(target.dataset.connectorIndex),
            nodeId: target.dataset.nodeId
        };
    }

    ensurePreviewLine() {
        if (this.previewLine) return;
        this.previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.previewLine.classList.add('connection-line', 'connection-line-preview');
        this.world.appendChild(this.previewLine);
    }

    updatePreviewLine(clientX, clientY) {
        if (!this.previewLine) return;
        const start = this.startNode.getConnectorWorldPosition(this.startType, this.startIndex);
        const end = this.camera.clientToWorld(clientX, clientY);
        const startNormal = this.startNode.getConnectorNormalWorld(this.startType);
        const distance = Math.hypot(end.x - start.x, end.y - start.y);
        const handleLength = Math.max(40, distance * 0.35);
        const toStartX = start.x - end.x;
        const toStartY = start.y - end.y;
        const toStartLen = Math.hypot(toStartX, toStartY) || 1;
        const endNormal = { x: toStartX / toStartLen, y: toStartY / toStartLen };
        const c1x = start.x + startNormal.x * handleLength;
        const c1y = start.y + startNormal.y * handleLength;
        const c2x = end.x + endNormal.x * handleLength;
        const c2y = end.y + endNormal.y * handleLength;
        const d = `M ${start.x} ${start.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${end.x} ${end.y}`;
        this.previewLine.setAttribute('d', d);
    }

    selectConnector({ node, type, index }) {
        const element = node.getConnectorElement(type, index);
        if (!element) return;
        this.clearSelectedConnector();
        this.selectionService.deselectAll();
        element.classList.add('node-connector-selected');
        this.selectedConnector = { node, type, index, element };
    }

    clearSelectedConnector() {
        if (!this.selectedConnector) return;
        const { element } = this.selectedConnector;
        if (element) {
            element.classList.remove('node-connector-selected');
        }
        this.selectedConnector = null;
    }

    isConnectorSelected(connector) {
        if (!this.selectedConnector) return false;
        return (
            this.selectedConnector.node.id === connector.nodeId &&
            this.selectedConnector.type === connector.type &&
            this.selectedConnector.index === connector.index
        );
    }

    handleKeyDown(e) {
        if (!this.selectedConnector) return;
        const key = e.key.toLowerCase();
        if (key !== 'delete' && key !== 'backspace') return;
        const { node, type, index } = this.selectedConnector;
        const removedConnections = node.removeConnector(type, index);
        removedConnections.forEach(connection => {
            connection.destroy();
            this.elementRegistry.remove(connection);
        });
        this.clearSelectedConnector();
        if (this.onChange) {
            this.onChange();
        }
        e.preventDefault();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        } else {
            e.stopPropagation();
        }
    }

    createConnection(endNode, endConnector) {
        if (endConnector.type === this.startType) {
            return;
        }
        const fromNode = this.startType === 'output' ? this.startNode : endNode;
        const toNode = this.startType === 'output' ? endNode : this.startNode;
        const fromIndex = this.startType === 'output' ? this.startIndex : endConnector.index;
        const toIndex = this.startType === 'output' ? endConnector.index : this.startIndex;
        const connection = new ConnectionElement(
            `connection_${this.connectionId++}`,
            fromNode,
            fromIndex,
            toNode,
            toIndex,
            this.world
        );
        connection.render();
        this.elementRegistry.add(connection);
        if (this.onChange) {
            this.onChange();
        }
    }

    cleanupPreview() {
        if (!this.previewLine) return;
        this.previewLine.remove();
        this.previewLine = null;
    }
}

export default NodeConnectionController;
