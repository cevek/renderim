function createVTextNode(text: string): VTextNodeCreated {
    return {
        _id: vNodeIdCounter++,
        status: 'created',
        id: genNodeId(),
        children: text,
        key: undefined,
        kind: textKind,
        props: undefined,
        type: undefined,
        state: undefined,
        parentComponent: undefined!,
    };
}

function createDomVNode(type: string, attrs: Attrs, key: string | undefined, children: VInput[]): VDomNodeCreated {
    return {
        _id: vNodeIdCounter++,
        status: 'created',
        id: genNodeId(),
        children: children,
        key: key,
        kind: domKind,
        props: attrs,
        type: type,
        state: undefined,
        parentComponent: undefined!,
    };
}

function createComponentVNode<Props extends object>(
    type: (props: Props) => VInput,
    props: Props,
    key?: string,
): VComponentNodeCreated {
    const componentId = nodeIdCounter++;
    let state = undefined;
    if (type === ErrorBoundary) {
        const val: ErrorBoundaryState = {
            componentId,
            errors: [],
        };
        state = val;
    } else if (type === Suspense) {
        const val: SuspenseState = {
            componentId,
            timeoutAt: 0,
            components: [],
            promises: [],
            resolvedPromises: 0,
        };
        state = val;
    } else {
        state = {componentId};
    }
    return {
        _id: vNodeIdCounter++,
        status: 'created',
        id: undefined!,
        children: undefined!,
        key: key,
        kind: componentKind,
        props,
        type: type as ComponentFun,
        state,
        parentComponent: undefined!,
    };
}

function createVArrayNode(arr: VInput[]): VArrayNodeCreated {
    return {
        _id: vNodeIdCounter++,
        status: 'created',
        kind: arrayKind,
        id: undefined!,
        children: arr,
        key: undefined,
        props: undefined,
        type: undefined,
        state: nodeIdCounter++,
        parentComponent: undefined!,
    };
}
function createVPortalNode(type: ID, children: VInput): VPortalNodeCreated {
    return {
        _id: vNodeIdCounter++,
        status: 'created',
        kind: portalKind,
        id: undefined,
        children: children,
        key: undefined,
        props: undefined,
        type: type,
        state: undefined,
        parentComponent: undefined!,
    };
}

function norm(value: VInput): VNodeCreated {
    if (value === null || value === undefined) {
        return createVTextNode('');
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return createVTextNode('');
        return createVArrayNode(value);
    }
    if (isVNode(value)) {
        if (value.status === 'cancelled') {
            return cloneVNode(value, true);
        }
        assert(value.status === 'created' || value.status === 'active');
        return value;
    }
    if (isObj(value)) {
        console.warn('objects are not allowed as children', value);
    }
    if (typeof value === 'string' || typeof value === 'number') {
        return createVTextNode(String(value));
    }
    return createVTextNode('');
}

function isVNode(value: unknown): value is VNodeCreated {
    return isObj<{kind?: {parent?: {}}}>(value) && isObj(value.kind) && value.kind.parent === kindParent;
}

function cloneVNode(node: VNodeCreated, deep: boolean): VNodeCreated {
    if (node.kind === componentKind) {
        return createComponentVNode(node.type, node.props, node.key);
    }
    if (node.kind === domKind) {
        return createDomVNode(
            node.type,
            node.props,
            node.key,
            deep ? node.children.map(node => cloneVNode(norm(node), true)) : node.children,
        );
    }
    if (node.kind === arrayKind) {
        return createVArrayNode(deep ? node.children.map(node => cloneVNode(norm(node), true)) : node.children);
    }
    if (node.kind === portalKind) {
        return createVPortalNode(node.type, deep ? cloneVNode(norm(node.children), true) : node.children);
    }
    if (node.kind === textKind) {
        return createVTextNode(node.children);
    }
    return never(node);
}

function ensureVDomNode(node: VInput) {
    if (!isVNode(node) || node.kind !== domKind) throw new AssertError('Children must be a tag element');
    return node;
}

function getPersistId(node: VNode): ID {
    if (node.kind === componentKind) {
        return node.state.componentId as ID;
    }
    if (node.kind === portalKind) {
        return node.type;
    }
    if (node.kind === arrayKind) {
        return node.state as ID;
    }
    return node.id;
}
