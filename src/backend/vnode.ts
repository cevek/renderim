function createVTextNode(text: string): VTextNodeCreated {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        children: text,
        key: undefined,
        kind: TEXT_KIND,
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
        kind: DOM_KIND,
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
        kind: COMPONENT_KIND,
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
        kind: ARRAY_KIND,
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
        kind: PORTAL_KIND,
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
    return isObj<{kind?: {parent?: {}}}>(value) && isObj(value.kind) && value.kind.parent === PARENT_KIND;
}

function cloneVNode<T extends VNodeCreated>(n: T, newProps = n.props, deep: boolean): T {
    const node = n as VNodeCreated;
    if (node.kind === COMPONENT_KIND) {
        return createComponentVNode(node.type, newProps as object, node.key) as T;
    }
    if (node.kind === DOM_KIND) {
        const children = deep
            ? (node as VDomNodeCreated).children.map(node => cloneVNode(norm(node), undefined, true))
            : (node.children as VInput[]);
        return createDomVNode(node.type, newProps as Attrs, node.key, children) as T;
    }
    if (node.kind === ARRAY_KIND) {
        const children = deep
            ? (node as VArrayNodeCreated).children.map(node => cloneVNode(norm(node), undefined, true))
            : (node.children as VInput[]);
        return createVArrayNode(children) as T;
    }
    if (node.kind === PORTAL_KIND) {
        return createVPortalNode(
            node.instance,
            deep ? cloneVNode(norm(node.children), undefined, true) : node.children,
        ) as T;
    }
    if (node.kind === TEXT_KIND) {
        return createVTextNode(node.children) as T;
    }
    return never(node);
}

function ensureVDomNode(node: VInput) {
    if (!isVNode(node) || node.kind !== DOM_KIND) throw new Error('Children must be a tag element');
    return node;
}

function getPersistId(node: VNodeCreated | RootId): ID {
    if (typeof node === 'string') return (node as unknown) as ID;
    if (node.kind === COMPONENT_KIND) {
        return node.instance.componentId as ID;
    }
    if (node.kind === PORTAL_KIND) {
        return node.instance;
    }
    if (node.kind === ARRAY_KIND) {
        return node.instance as ID;
    }
    return node.instance;
}
