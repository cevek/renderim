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

function render(node: VNode, htmlId: string) {
    const id = (htmlId as unknown) as ID;
    const oldNode = roots.get(id);
    const commandListEnd = commandList.length;
    assert(suspensePromises.length === 0);
    try {
        if (oldNode !== undefined) {
            updateVNode(node, oldNode, id);
        } else {
            roots.set(id, mountVNode(node, id, null));
        }
        if (suspensePromises.length > 0) {
            clearArrayUntil(commandList, commandListEnd);
            roots.set(id, mountVNode(norm(undefined), id, null));
            Promise.all(suspensePromises).then(() => render(node, htmlId), () => render(node, htmlId));
            clearArrayUntil(suspensePromises, 0);
            console.warn('Throws promise without root Suspense wrapper');
        }
    } catch (err) {
        clearArrayUntil(commandList, commandListEnd);
        suspensePromises = [];
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
