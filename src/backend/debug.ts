function assert(val: boolean) {
    if (typeof val !== 'boolean') throw new Error('Not Boolean');
    if (!val) {
        debugger;
        throw new Error('Assert!');
    }
}
function nonNull<T>(val: T | undefined): T {
    assert(val !== undefined);
    return val!;
}

function never(val?: never): never {
    throw new Error('Never possible: ' + val);
}


function visitEachNode(node: VNodeCreated, cb: (node: VNodeCreated) => void): void {
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

function is<T>(val: unknown): val is T {
    return true;
}
