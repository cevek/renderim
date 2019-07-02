function createVTextNode(text: string): VTextNodeCreated {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        children: text,
        key: undefined,
        kind: textKind,
        props: undefined,
        type: undefined,
        instance: genNodeId(),
        parentComponent: undefined!,
    };
}

// foo.bar
function createDomVNode(type: string, attrs: Attrs, key: string | undefined, children: VInput[]): VDomNodeCreated {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        children: children,
        key: key,
        kind: domKind,
        props: attrs,
        type: type,
        instance: genNodeId(),
        parentComponent: undefined!,
    };
}

function createComponentVNode<Props extends object>(
    type: (props: object) => VInput,
    props: object,
    key?: string,
): VComponentNodeCreated {
    const componentId = GLOBAL_CLIENT_NODE_ID_COUNTER++;
    const node: VComponentNodeCreated = {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        children: undefined!,
        key: key,
        kind: componentKind,
        props,
        type,
        instance: {
            parentDom: undefined!,
            trxId: -1,
            componentId,
            errored: false,
            node: undefined!,
            state: undefined,
        },
        parentComponent: undefined!,
    };
    node.instance.node = node as VComponentNode;
    return node;
}

function createVArrayNode(arr: VInput[]): VArrayNodeCreated {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        kind: arrayKind,
        children: arr,
        key: undefined,
        props: undefined,
        type: undefined,
        instance: GLOBAL_CLIENT_NODE_ID_COUNTER++,
        parentComponent: undefined!,
    };
}
function createVPortalNode(type: ID, children: VInput): VPortalNodeCreated {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        kind: portalKind,
        children: children,
        key: undefined,
        props: undefined,
        type: undefined,
        instance: type,
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
            node.instance,
            deep ? cloneVNode(norm(node.children), undefined, true) : node.children,
        ) as T;
    }
    if (node.kind === textKind) {
        return createVTextNode(node.children) as T;
    }
    return never(node);
}

function ensureVDomNode(node: VInput) {
    if (!isVNode(node) || node.kind !== domKind) throw new Error('Children must be a tag element');
    return node;
}

function getPersistId(node: VNodeCreated | RootId): ID {
    if (typeof node === 'string') return (node as unknown) as ID;
    if (node.kind === componentKind) {
        return node.instance.componentId as ID;
    }
    if (node.kind === portalKind) {
        return node.instance;
    }
    if (node.kind === arrayKind) {
        return node.instance as ID;
    }
    return node.instance;
}
