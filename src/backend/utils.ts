function never(val?: never): never {
    throw new AssertError('Never possible: ' + val);
}

function genId() {
    return (id++ as unknown) as ID;
}

function findChildVDom(node: VNode): VDomNode | VTextNode {
    if (node.kind === domKind || node.kind === textKind) return node;
    if (node.kind === componentKind) return findChildVDom(node.children);
    if (node.kind === arrayKind) return findChildVDom(node.children[0]);
    if (node.kind === portalKind) return findChildVDom(node.children);
    return never(node);
}

class AssertError extends Error {}
function assert(val: boolean) {
    if (typeof val !== 'boolean') throw new AssertError('Not Boolean');
    if (!val) {
        debugger;
        throw new AssertError('Assert!');
    }
}
function nonNull<T>(val: T | undefined): T {
    assert(val !== undefined);
    return val!;
}

function sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
}

function noop() {}

function addCommand(node: VNode | VNodeCreated, command: Command) {
    const comandWithVNode = command as CommandWithParentVNode;
    comandWithVNode.vNode = node;
    commandList.push(command);
}

function toJSON(node: VNode): unknown {
    const {key, suspense, errorBoundary, extra, kind, type, props, id, ...other} = node as any;
    other.kind = kind.constructor.name;
    if (type) {
        other.type = typeof type === 'string' ? type : type.name;
    }
    if (Array.isArray(node.children)) {
        other.children = node.children.map(val => toJSON(val as VNode));
    } else if (typeof node.children !== 'string') {
        other.children = toJSON(node.children as any);
    }
    return other;
}

function ensureObject<T>(value: T | null | undefined | number | string | boolean | symbol): T {
    if (typeof value === 'object' && value !== null) return value;
    return {} as T;
}

function visitEachNode(node: VNode | VNodeCreated, cb: (node: VNode | VNodeCreated) => void): void {
    cb(node);
    if (node.kind === componentKind) {
        return visitEachNode(node.children as VNode, cb);
    }
    if (node.kind === domKind) {
        for (const child of node.children) {
            visitEachNode(child as VNode, cb);
        }
        return;
    }
    if (node.kind === arrayKind) {
        for (const child of node.children) {
            visitEachNode(child as VNode, cb);
        }
        return;
    }
    if (node.kind === portalKind) {
        visitEachNode(node.children as VNode, cb);
        return;
    }
    if (node.kind === textKind) {
        return;
    }
    return never(node);
}
