class ElementRegistry {
    constructor() {
        this.elements = [];
        this.elementMap = new Map();
    }

    add(element) {
        if (!element || !element.id) return;
        if (this.elementMap.has(element.id)) return;
        this.elements.push(element);
        this.elementMap.set(element.id, element);
    }

    remove(element) {
        if (!element) return;
        this.elementMap.delete(element.id);
        const index = this.elements.indexOf(element);
        if (index > -1) {
            this.elements.splice(index, 1);
        }
    }

    getById(id) {
        return this.elementMap.get(id) || null;
    }

    getAll() {
        return this.elements;
    }
}

export default ElementRegistry;
