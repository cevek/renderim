function createElement(type: string | ComponentFun, props: object | null, ...children: Return[]): VElement {
    const key = props === null ? undefined : (props as {key?: string}).key;
    if (typeof type === 'string') {
        return createDomVNode(type, props, key, children);
    } else if (typeof type === 'function') {
        return createComponentVNode(type, props, key, children);
    } else {
        throw new Error('Component type is empty: ' + type);
    }
}

function render(node: VElement, htmlId: string) {
    const id = (htmlId as unknown) as ID;
    const oldNode = roots.get(id);
    const commandListEnd = commandList.length;
    try {
        if (oldNode !== undefined) {
            updateVNode(node, oldNode, id);
        } else {
            roots.set(id, node);
            mountVNode(node, id, null);
        }
    } catch (err) {
        clearCommandsUntil(commandListEnd);
        if (oldNode !== undefined) {
            unmount(htmlId);
        }
    }
}

function unmount(htmlId: string) {
    const node = roots.get((htmlId as unknown) as ID);
    if (node !== undefined) {
        removeVNode(node, true);
    }
}

function getCommandList() {
    return commandList;
}
