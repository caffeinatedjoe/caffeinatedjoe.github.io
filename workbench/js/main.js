import RadialMenu from './ui/RadialMenu.js';
import createWorkbench from './workbench/createWorkbench.js';

const workbenchEl = document.getElementById('workbench');
const viewport = workbenchEl.querySelector('[data-workbench="viewport"]');
const rasterLayer = workbenchEl.querySelector('[data-workbench="raster"]');
const vectorLayer = workbenchEl.querySelector('[data-workbench="vector"]');
const world = workbenchEl.querySelector('[data-workbench="world"]');

const FLOW_CHANGE_EVENT = 'nodeflow:changed';

function dispatchFlowChange() {
    document.dispatchEvent(new CustomEvent(FLOW_CHANGE_EVENT));
}

const icons = {
    circle: { path: 'M 0 0 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0', size: 50, color: 'rgba(0,0,0,0.8)' },
    line: { path: 'M -5 -5 l 10 10', size: 50, color: 'rgba(0,0,0,0.8)' },
    rectangle: { path: 'M -8 -5 h 16 v 10 h -16 z', size: 40, color: 'rgba(0,0,0,0.8)' },
    node: { path: 'M -9 -6 h 18 a 4 4 0 0 1 4 4 v 4 a 4 4 0 0 1 -4 4 h -18 a 4 4 0 0 1 -4 -4 v -4 a 4 -4 0 0 1 4 -4 Z', size: 40, color: 'rgba(0,0,0,0.8)' },
    cursor: { path: 'm 1.872 9.6 l 3.656 -1.48 l -2.736 -6.752 l 4.448 0.08 L -3.76 -9.6 l -0.24 15.592 l 3.144 -3.144 Z', size: 35, color: 'rgba(0,0,0,0.8)' }
};

const contextState = { x: 0, y: 0 };

const menu = new RadialMenu({
    innerDiameter: 70,
    outerDiameter: 170,
    sections: [],
    container: workbenchEl
});

workbenchEl.addEventListener('contextmenu', (e) => e.preventDefault());

const workbench = createWorkbench({
    viewportEl: viewport,
    vectorLayerEl: vectorLayer,
    worldEl: world,
    rasterLayerEl: rasterLayer,
    menu,
    onFlowChange: dispatchFlowChange,
    onContext: (worldPoint) => {
        contextState.x = worldPoint.x;
        contextState.y = worldPoint.y;
    }
});

menu.setSections([
    { id: 'circle', icon: icons.circle, action: () => workbench.addElement({ type: 'circle', position: { ...contextState }, r: 30, scale: 1, rotation: 0 }) },
    { id: 'rectangle', icon: icons.rectangle, action: () => workbench.addElement({ type: 'rectangle', position: { ...contextState }, width: 100, height: 50, scale: 1, rotation: 0 }) },
    { id: 'node', icon: icons.node, action: () => workbench.addElement({ type: 'node', position: { ...contextState }, width: 140, height: 80, inputCount: 1, outputCount: 1, scale: 1, rotation: 0 }) },
    { id: 'line', icon: icons.line, action: () => workbench.addElement({ type: 'line', x1: contextState.x - 60, y1: contextState.y - 20, x2: contextState.x + 60, y2: contextState.y + 20, scale: 1, rotation: 0 }) }
]);

const scheduleFlowRun = (() => {
    let frame = null;
    return () => {
        if (frame !== null) return;
        frame = window.requestAnimationFrame(() => {
            frame = null;
            logFlowsFromOrigins();
        });
    };
})();

document.addEventListener(FLOW_CHANGE_EVENT, scheduleFlowRun);

function buildNodeAdjacency() {
    const nodes = workbench.getElements().filter(element => element.type === 'node');
    const adjacency = new Map(nodes.map(node => [node.id, []]));
    const inDegree = new Map(nodes.map(node => [node.id, 0]));
    workbench.getElements().forEach(element => {
        if (element.type !== 'connection' || !element.fromNode || !element.toNode) return;
        if (!adjacency.has(element.fromNode.id)) {
            adjacency.set(element.fromNode.id, []);
        }
        adjacency.get(element.fromNode.id).push(element.toNode);
        inDegree.set(element.toNode.id, (inDegree.get(element.toNode.id) ?? 0) + 1);
    });
    return { nodes, adjacency, inDegree };
}

function formatNodeText(node) {
    const text = node.getTextValue ? node.getTextValue() : '';
    return text.replace(/\s+/g, ' ').trim();
}

function collectFlows(startNode, adjacency) {
    const flows = [];
    const walk = (node, path, visited) => {
        const nextNodes = adjacency.get(node.id) || [];
        if (nextNodes.length === 0) {
            flows.push(path.slice());
            return;
        }
        nextNodes.forEach(nextNode => {
            if (visited.has(nextNode.id)) {
                const cyclePath = path.concat('cycle');
                flows.push(cyclePath);
                return;
            }
            visited.add(nextNode.id);
            path.push(formatNodeText(nextNode));
            walk(nextNode, path, visited);
            path.pop();
            visited.delete(nextNode.id);
        });
    };
    walk(startNode, [formatNodeText(startNode)], new Set([startNode.id]));
    return flows;
}

function logFlowsFromOrigins() {
    const { nodes, adjacency, inDegree } = buildNodeAdjacency();
    if (nodes.length === 0) {
        console.log('No nodes available to traverse.');
        return;
    }
    const origins = nodes.filter(node => (inDegree.get(node.id) ?? 0) === 0);
    const roots = origins.length > 0 ? origins : nodes;
    roots.forEach(node => {
        const flows = collectFlows(node, adjacency);
        if (flows.length === 0) {
            const text = formatNodeText(node);
            console.log(`[flow] ${text}`);
            return;
        }
        flows.forEach(flow => {
            const text = flow.filter(Boolean).join(' ').trim();
            console.log(`[flow] ${text}`);
        });
    });
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tagName = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tagName === 'input' || tagName === 'textarea') return;
    if (e.key.toLowerCase() === 'f') {
        logFlowsFromOrigins();
    }
});
