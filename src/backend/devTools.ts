// const devToolsNodes = new Map<number, DevToolsNode>();

// let devToolsId = 0;
function convertVNodeToDevToolsJSON(node: VNode): DevToolsNode {
    // const id = devToolsId++;
    let stringText;
    let children: DevToolsNode[] = [];
    let currentElement;
    let instance;
    let nodeId: number;
    const id = getPersistId(node);
    const renderedComponent = undefined;
    if (node.kind === componentKind) {
        nodeId = findChildVDom(node).id;
        currentElement = {type: node.type.name, props: {todo: 1}};
        instance = node.state as object;
        children = [convertVNodeToDevToolsJSON(node.children)];
    } else if (node.kind === domKind) {
        nodeId = node.id;
        currentElement = {type: node.type, props: {todo: 1}};
        children = node.children.map(convertVNodeToDevToolsJSON);
    } else if (node.kind === arrayKind) {
        nodeId = findChildVDom(node).id;
        currentElement = {type: '#array', props: {}};
        children = node.children.map(convertVNodeToDevToolsJSON);
    } else if (node.kind === portalKind) {
        nodeId = findChildVDom(node).id;
        currentElement = {type: '#portal', props: {}};
        children = [convertVNodeToDevToolsJSON(node.children)];
    } else if (node.kind === textKind) {
        nodeId = node.id;
        stringText = node.children;
    } else {
        return never(node);
    }
    // const dNode = devToolsNodes.get(id);
    // if (dNode !== undefined) return dNode;
    const devToolsNode: DevToolsNode = {
        _id: id,
        _nodeId: nodeId,
        _stringText: stringText,
        _instance: instance,
        _currentElement: currentElement,
        _renderedChildren: children,
        _inDevTools: true,
        _renderedComponent: renderedComponent,
    };
    // devToolsNodes.set(id, devToolsNode);
    return devToolsNode;
}
