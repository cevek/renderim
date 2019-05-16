function getCurrentComponentNode() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent;
}

function runComponent(node: VComponentNode) {
    const prev = currentComponent;
    currentComponent = node;
    try {
        const child = node.type(node.props);
        node.children = norm(child);
    } finally {
        currentComponent = prev;
    }
}

function restartComponent(node: VComponentNode) {
    const oldChildren = node.children;
    runComponent(node);
    updateVNode(node.children, oldChildren, node.id);
}
