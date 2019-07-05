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
    if (node.kind === COMPONENT_KIND) {
        return visitEachNode(node.children as VNode, cb);
    }
    if (node.kind === DOM_KIND) {
        for (const child of node.children) {
            visitEachNode(child as VNode, cb);
        }
        return;
    }
    if (node.kind === ARRAY_KIND) {
        for (const child of node.children) {
            visitEachNode(child as VNode, cb);
        }
        return;
    }
    if (node.kind === PORTAL_KIND) {
        visitEachNode(node.children as VNode, cb);
        return;
    }
    if (node.kind === TEXT_KIND) {
        return;
    }
    return never(node);
}

function is<T>(val: unknown): val is T {
    return true;
}
