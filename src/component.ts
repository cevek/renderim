function getCurrentComponentNode() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent;
}

function runComponent(node: VComponentNode) {
    const prev = currentComponent;
    currentComponent = node;
    try {
        node.children = norm(node.type(node.props));
    } finally {
        currentComponent = prev;
    }
}

function restartComponent(node: VComponentNode) {
    const oldChildren = node.children;
    runComponent(node);
    updateVNode(node.children, oldChildren, node.id);
}

function Fragment(props: {children: Return}) {
    return props.children as VComponentNode;
}
