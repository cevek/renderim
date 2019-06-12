function never(val?: never): never {
    throw new AssertError('Never possible: ' + val);
}

function genNodeId() {
    return (nodeIdCounter++ as unknown) as ID;
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
    const {key, suspense, errorBoundary, state, kind, type, props, id, ...other} = node as any;
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

function ensureObject<T extends object>(value: T | null | undefined | number | string | boolean | symbol): T {
    if (isObj<T>(value)) return value;
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

function customUrl(customChild: JSX.CustomChild) {
    isCustomUrlCall = true;
    const url = typeof customChild.url === 'function' ? ((customChild.url() as unknown) as string) : undefined;
    isCustomUrlCall = false;
    return url;
}

function isObj<T extends object>(obj: unknown): obj is T {
    return typeof obj === 'object' && obj !== null;
}

function isObjectSame(obj1: unknown, obj2: unknown) {
    type Hash = {[key: string]: unknown};
    if (isObj<Hash>(obj1) && isObj<Hash>(obj2) && obj1.constructor === obj2.constructor) {
        if (Array.isArray(obj2)) {
            if (obj1.length !== obj2.length) return false;
            if (!obj2.every((obj2Item, i) => isObjectSame(obj1[i], obj2Item))) return false;
        } else {
            let len = 0;
            for (const key in obj1) {
                len++;
                if (!isObjectSame(obj1[key], obj2[key])) return false;
            }
            for (const key in obj2) len--;
            if (len !== 0) return false;
        }
        return true;
    }
    return obj1 === obj2;
}

function immutableDeepMerge<T>(obj1: T, obj2: T): T {
    if (isObjectSame(obj1, obj2)) return obj1;
    type Hash = {[key: string]: Hash};
    if (isObj<Hash>(obj1) && isObj<Hash>(obj2)) {
        const newObj = (Array.isArray(obj1) ? [] : {}) as Hash;
        for (const key in obj2) {
            newObj[key] = immutableDeepMerge(obj1[key], obj2[key]) as Hash;
        }
        return (newObj as {}) as T;
    }
    return obj2;
}

function is<T>(val: unknown): val is T {
    return true;
}
