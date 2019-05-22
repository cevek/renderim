function never(val?: never): never {
    throw new Error('Never possible: ' + val);
}

function genId() {
    return (id++ as unknown) as ID;
}

// function normChild(parent: VDomNode | VArrayNode | VPortalNode, i: number): VNode {
//     const child = parent.children[i];
//     const newChild = norm(child);
//     if (child !== newChild) {
//         parent.children[i] = newChild;
//     }
//     return newChild;
// }

function findChildVDom(node: VNode): VDomNode | VTextNode {
    if (node.kind === domKind || node.kind === textKind) return node;
    if (node.kind === componentKind) return findChildVDom(node.children);
    if (node.kind === arrayKind) return findChildVDom(node.children[0] as VNode);
    if (node.kind === portalKind) return findChildVDom(node.children[0] as VNode);
    return never(node);
}

// function clearArrayUntil(array: unknown[], until: number) {
//     while (array.length > until) array.pop();
// }

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

function addCommand(node: VNode, command: Command) {
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
        other.children = toJSON(node.children);
    }
    return other;
}
