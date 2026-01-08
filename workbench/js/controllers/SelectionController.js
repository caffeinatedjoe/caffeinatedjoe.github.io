class SelectionController {
    constructor({ pointer, elementRegistry, selectionService, interactionState }) {
        this.pointer = pointer;
        this.elementRegistry = elementRegistry;
        this.selectionService = selectionService;
        this.interactionState = interactionState;
        this.bindEvents();
    }

    bindEvents() {
        this.pointer.on('click', (e) => this.onClick(e));
    }

    onClick(e) {
        const isElementClicked = this.elementRegistry.getAll().some(element => (
            element.isHitTarget && element.isHitTarget(e.target)
        ));
        const isHandleClicked = !!(e.target && e.target.dataset && e.target.dataset.handleType);
        if (this.interactionState.dragOccurred) {
            this.interactionState.dragOccurred = false;
            if (!isElementClicked) {
                return;
            }
        }
        if (isElementClicked || isHandleClicked) {
            e.preventDefault();
            return;
        }
        this.selectionService.handleClick(e, e.shiftKey);
    }
}

export default SelectionController;
