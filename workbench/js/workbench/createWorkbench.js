import CameraController from '../core/CameraController.js';
import ViewportRenderer from '../renderers/ViewportRenderer.js';
import ElementRegistry from '../services/ElementRegistry.js';
import SelectionService from '../services/SelectionService.js';
import ClipboardService from '../services/ClipboardService.js';
import HandleRenderer from '../renderers/HandleRenderer.js';
import PointerInputAdapter from '../input/PointerInputAdapter.js';
import KeyboardInputAdapter from '../input/KeyboardInputAdapter.js';
import CircleElement from '../elements/CircleElement.js';
import RectangleElement from '../elements/RectangleElement.js';
import LineElement from '../elements/LineElement.js';
import TextElement from '../elements/TextElement.js';
import NodeElement from '../elements/NodeElement.js';
import PanningController from '../controllers/PanningController.js';
import TransformController from '../controllers/TransformController.js';
import MenuController from '../controllers/MenuController.js';
import SelectionController from '../controllers/SelectionController.js';
import ZoomController from '../controllers/ZoomController.js';
import MarqueeSelectionController from '../controllers/MarqueeSelectionController.js';
import NodeConnectionController from '../controllers/NodeConnectionController.js';

const DEFAULT_CAMERA_STATE = {
    offsetX: 0,
    offsetY: 0,
    scale: 1
};

function createWorkbench({
    viewportEl,
    vectorLayerEl,
    worldEl,
    rasterLayerEl,
    menu,
    inputs = {},
    onFlowChange,
    onContext
}) {
    const cameraState = { ...DEFAULT_CAMERA_STATE };
    const viewportRenderer = new ViewportRenderer({
        viewportEl,
        rasterLayerEl,
        worldEl
    });
    const camera = new CameraController({ state: cameraState, renderer: viewportRenderer });
    const elementRegistry = new ElementRegistry();
    const handleRenderer = new HandleRenderer({ container: worldEl });
    const selectionService = new SelectionService({ elementRegistry, handleRenderer });
    const clipboardService = new ClipboardService({
        elementRegistry,
        selectionService,
        onChange: onFlowChange
    });
    const interactionState = { dragOccurred: false };
    let elementIdCounter = 0;
    let lastCursorWorld = { x: 0, y: 0 };

    const pointer = inputs.pointer || new PointerInputAdapter({ viewportEl });
    const keyboard = inputs.keyboard || new KeyboardInputAdapter({ target: window });

    const onResize = () => camera.resize();
    window.addEventListener('resize', onResize);

    pointer.on('mousemove', (e) => {
        lastCursorWorld = camera.clientToWorld(e.clientX, e.clientY);
    });

    const createElementFromDescriptor = (descriptor) => {
        const id = descriptor.id || `${descriptor.type}_${elementIdCounter++}`;
        if (descriptor.type === 'circle') {
            const circle = new CircleElement(id, descriptor.position.x, descriptor.position.y, descriptor.r, worldEl);
            circle.render();
            circle.scale = descriptor.scale ?? 1;
            circle.rotation = descriptor.rotation ?? 0;
            circle.updateSvgScale();
            return circle;
        }
        if (descriptor.type === 'rectangle') {
            const x = descriptor.position.x - descriptor.width / 2;
            const y = descriptor.position.y - descriptor.height / 2;
            const rect = new RectangleElement(id, x, y, descriptor.width, descriptor.height, worldEl);
            rect.render();
            rect.scale = descriptor.scale ?? 1;
            rect.rotation = descriptor.rotation ?? 0;
            rect.updateSvgScale();
            return rect;
        }
        if (descriptor.type === 'line') {
            const line = new LineElement(id, descriptor.x1, descriptor.y1, descriptor.x2, descriptor.y2, worldEl);
            line.render();
            line.scale = descriptor.scale ?? 1;
            line.rotation = descriptor.rotation ?? 0;
            return line;
        }
        if (descriptor.type === 'text') {
            const text = new TextElement(
                id,
                descriptor.position.x,
                descriptor.position.y,
                descriptor.text,
                worldEl,
                {
                    fontSize: descriptor.baseFontSize,
                    fontFamily: descriptor.fontFamily,
                    fill: descriptor.fill
                }
            );
            text.render();
            text.scale = descriptor.scale ?? 1;
            text.rotation = descriptor.rotation ?? 0;
            text.updateSvgScale();
            return text;
        }
        if (descriptor.type === 'node') {
            const x = descriptor.position.x - descriptor.width / 2;
            const y = descriptor.position.y - descriptor.height / 2;
            const node = new NodeElement(id, x, y, descriptor.width, descriptor.height, worldEl, {
                inputCount: descriptor.inputCount,
                outputCount: descriptor.outputCount,
                cornerRadius: descriptor.cornerRadius,
                textValue: descriptor.textValue,
                onChange: onFlowChange
            });
            node.render();
            node.scale = descriptor.scale ?? 1;
            node.rotation = descriptor.rotation ?? 0;
            node.updateSvgScale();
            return node;
        }
        return null;
    };

    const addElement = (descriptor) => {
        const element = createElementFromDescriptor(descriptor);
        if (!element) return null;
        elementRegistry.add(element);
        if (descriptor.type === 'node' && onFlowChange) {
            onFlowChange();
        }
        return element.id;
    };

    const destroy = () => {
        window.removeEventListener('resize', onResize);
        pointer.destroy();
        keyboard.destroy();
        selectionService.deselectAll();
        handleRenderer.removeGroupHandles();
    };

    new PanningController({ pointer, camera, menu });
    new TransformController({
        pointer,
        elementRegistry,
        selectionService,
        camera,
        interactionState
    });
    if (menu) {
        new MenuController({
            pointer,
            camera,
            menu,
            onContext,
            overlayContainer: typeof menu.getContainer === 'function' ? menu.getContainer() : undefined
        });
    }
    new SelectionController({ pointer, elementRegistry, selectionService, interactionState });
    new MarqueeSelectionController({
        pointer,
        world: worldEl,
        elementRegistry,
        selectionService,
        camera,
        interactionState
    });
    new ZoomController({ pointer, camera, menu });
    new NodeConnectionController({
        pointer,
        world: worldEl,
        camera,
        elementRegistry,
        selectionService,
        onChange: onFlowChange
    });

    const onKeyDown = (e) => {
        const key = e.key.toLowerCase();
        const hasModifier = e.ctrlKey || e.metaKey;
        const tagName = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (tagName === 'input' || tagName === 'textarea') {
            return;
        }

        if (hasModifier && key === 'c') {
            clipboardService.copySelection();
            e.preventDefault();
            return;
        }

        if (hasModifier && key === 'v') {
            clipboardService.pasteClipboard(createElementFromDescriptor, lastCursorWorld);
            e.preventDefault();
            return;
        }

        if ((key === 'delete' || key === 'backspace') && selectionService.getSelected().length > 0) {
            const selected = selectionService.getSelected().slice();
            selectionService.deselectAll();
            selected.forEach(element => {
                element.delete();
                elementRegistry.remove(element);
            });
            if (onFlowChange) {
                onFlowChange();
            }
            e.preventDefault();
        }
    };

    keyboard.on('keydown', onKeyDown);

    return {
        addElement,
        setSelection: (ids = []) => {
            const elements = ids.map(id => elementRegistry.getById(id)).filter(Boolean);
            selectionService.setSelection(elements);
        },
        getElements: () => elementRegistry.getAll(),
        getElementById: (id) => elementRegistry.getById(id),
        getCamera: () => camera,
        getLastCursorWorld: () => lastCursorWorld,
        destroy
    };
}

export default createWorkbench;
