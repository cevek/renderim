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
    type: (props: object) => VInput,
    props: object,
    key?: string,
): VComponentNodeCreated {
    const componentId = nodeIdCounter++;
    let state;
    if (type === ErrorBoundary) {
        const val: ErrorBoundaryState = {
            componentId,
            errored: false,
            errors: [],
            node: undefined!,
        };
        state = val;
    } else if (type === Suspense) {
        const val: SuspenseState = {
            componentId,
            version: 0,
            errored: false,
            timeoutAt: 0.0,
            node: undefined!,
            components: new Map(),
        };
        state = val;
    } else {
        state = {componentId, errored: false, node: undefined!};
    }
    const node: VComponentNodeCreated = {
        _id: vNodeIdCounter++,
        status: 'created',
        id: undefined!,
        children: undefined!,
        key: key,
        kind: componentKind,
        props,
        type,
        state,
        parentComponent: undefined!,
    };
    node.state.node = node as VComponentNode;
    return node;
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
        if (value.status === 'cancelled' || value.status === 'obsolete' || value.status === 'removed') {
            return cloneVNode(value, undefined, true);
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

function cloneVNode<T extends VNodeCreated>(n: T, newProps = n.props, deep: boolean): T {
    const node = n as VNodeCreated;
    if (node.kind === componentKind) {
        return createComponentVNode(node.type, newProps as object, node.key) as T;
    }
    if (node.kind === domKind) {
        const children = deep
            ? (node as VDomNodeCreated).children.map(node => cloneVNode(norm(node), undefined, true))
            : (node.children as VInput[]);
        return createDomVNode(node.type, newProps as Attrs, node.key, children) as T;
    }
    if (node.kind === arrayKind) {
        const children = deep
            ? (node as VArrayNodeCreated).children.map(node => cloneVNode(norm(node), undefined, true))
            : (node.children as VInput[]);
        return createVArrayNode(children) as T;
    }
    if (node.kind === portalKind) {
        return createVPortalNode(
            node.type,
            deep ? cloneVNode(norm(node.children), undefined, true) : node.children,
        ) as T;
    }
    if (node.kind === textKind) {
        return createVTextNode(node.children) as T;
    }
    return never(node);
}

function ensureVDomNode(node: VInput) {
    if (!isVNode(node) || node.kind !== domKind) throw new AssertError('Children must be a tag element');
    return node;
}

function getPersistId(node: VNodeCreated | RootId): ID {
    if (typeof node === 'string') return (node as unknown) as ID;
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
