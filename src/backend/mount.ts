function mountVNode(parentNode: ParentComponent, node: VNodeCreated, parentId: ID, beforeId: ID | null): VNode {
    if (node.status === 'active') {
        node = cloneVNode(node, undefined, false);
    }
    assert(node.status === 'created');
    // assert(!maybeCancelled.includes(node));
    updatings.push({kind: 'created', node: node})

    node.parentComponent = parentNode;
    if (node.kind === componentKind) {
        node = mountComponent(node, parentId, beforeId);
    } else if (node.kind === domKind) {
        node = mountVDom(node, parentId, beforeId);
    } else if (node.kind === textKind) {
        addCommand(node, {
            action: 'create',
            group: 'text',
            rootId: findRootId(node),
            parentId,
            beforeId,
            id: node.id,
            text: node.children,
        });
    } else if (node.kind === arrayKind) {
        for (let i = 0; i < node.children.length; i++) {
            mountChild(node, i, parentId, beforeId);
        }
    } else if (node.kind === portalKind) {
        node.children = mountVNode(node, norm(node.children), node.type, null);
    } else {
        throw never(node);
    }
    node.status = 'active';
    return node as VNode;
}

function mountComponent(node: VComponentNodeCreated, parentId: ID, beforeId: ID | null): VComponentNodeCreated {
    node.id = parentId;
    const newChildren = runComponent(node);
    node.children = mountVNode(node, newChildren, parentId, beforeId);
    return node;
}

function mountVDom(node: VDomNodeCreated, parentId: ID, beforeId: ID | null) {
    const props = node.props as JSX.IntrinsicElements[string];
    addCommand(node, {
        action: 'create',
        group: 'tag',
        parentId,
        beforeId,
        rootId: findRootId(node),
        id: node.id,
        attrs: transformAttrCallbacks(node.props),
        tag: node.type,
    });
    for (let i = 0; i < node.children.length; i++) {
        mountChild(node, i, node.id, null);
    }
    if (node.type === 'select') {
        updateSelectValue(node);
    }
    if (props.withCommand !== undefined) {
        addCommand(node, {
            action: 'create',
            group: 'custom',
            parentId: node.id,
            data: props.withCommand.data,
            name: props.withCommand.name,
        });
    }
    return node;
}

function mountChild(node: VDomNodeCreated | VArrayNodeCreated, i: number, parentId: ID, beforeId: ID | null) {
    (node as VNodeCreatedChildren).children[i] = mountVNode(node, norm(node.children[i]), parentId, beforeId);
}
