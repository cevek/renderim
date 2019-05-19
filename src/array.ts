function updateArray(node: VArrayNode, oldNode: VArrayNode, parentId: ID): VArrayNode {
    const newList = node.children;
    const oldList = oldNode.children as VNode[];
    const skipHead = updateHead(node, oldNode, parentId);
    const skipTail = updateTail(node, oldNode, skipHead, parentId);
    const newEnd = newList.length - skipTail;
    const oldEnd = oldList.length - skipTail;

    const newDiff = newEnd - skipHead;
    const oldDiff = oldEnd - skipHead;

    if (newDiff > 0 || oldDiff > 0) {
        const map: {[key: string]: number} = {};
        const oldUsed: (true | undefined)[] = Array(oldList.length);
        if (newDiff > 0 && oldDiff > 0) {
            for (let i = skipHead; i < oldEnd; i++) {
                const oldChild = oldList[i];
                map[oldChild.key!] = i;
            }
        }
        // for (let i = skipHead; i < newEnd; i++) {
        //     const child = norm(node.children[i]);
        //     const oldChildIdx = map[child.key!];
        //     if (oldChildIdx !== undefined && oldUsed[oldChildIdx] === undefined) {
        //         oldUsed[oldChildIdx] = true;
        //         const oldChild = oldList[oldChildIdx];
        //         // renderOrder.push(oldChildIdx);
        //         // todo: move
        //         updateChild(node, i, child, oldChild, parentId);
        //     } else {
        //         // renderOrder.push(-1);
        //         createChild(node, i, child, parentId, 1);
        //     }
        // }
        let beforeVNode = newEnd < node.children.length ? (node.children[newEnd] as VNode) : undefined;
        for (let i = newEnd - 1; i >= skipHead; i--) {
            const child = norm(node.children[i]);
            const oldChildIdx = map[child.key!];
            const beforeId = beforeVNode === undefined ? null : findChildVDom(beforeVNode).id;
            if (oldChildIdx !== undefined && oldUsed[oldChildIdx] === undefined) {
                oldUsed[oldChildIdx] = true;
                const oldChild = oldList[oldChildIdx];
                beforeVNode = updateChild(node, i, child, oldChild, parentId);
                moveChild(child, beforeId);
            } else {
                beforeVNode = mountChild(node, i, child, parentId, beforeId);
            }
        }
        // console.log({beforeVNode, newEnd, skipHead, oldEnd, map, oldUsed});
        for (let i = skipHead; i < oldEnd; i++) {
            if (oldUsed[i] === undefined) {
                const oldChild = oldList[i];
                removeVNode(oldChild, true);
            }
        }
    }
    node.status = 'active';
    oldNode.status = 'stalled';
    return node;
}

function updateHead(node: VArrayNode, oldNode: VArrayNode, parentId: ID) {
    const max = node.children.length < oldNode.children.length ? node.children.length : oldNode.children.length;
    let start = 0;
    while (start < max) {
        const child = norm(node.children[start]);
        const oldChild = oldNode.children[start] as VNode;
        if (child.key !== oldChild.key) break;
        updateChild(node, start, child, oldChild, parentId);
        start++;
    }
    return start;
}

function updateTail(node: VArrayNode, oldNode: VArrayNode, skipHead: number, parentId: ID) {
    let newEnd = node.children.length;
    let oldEnd = oldNode.children.length;
    while (newEnd > skipHead && oldEnd > skipHead) {
        const newI = newEnd - 1;
        const oldI = oldEnd - 1;
        const child = norm(node.children[newI]);
        const oldChild = oldNode.children[oldI] as VNode;
        if (child.key !== oldChild.key) break;
        updateChild(node, newI, child, oldChild, parentId);
        newEnd--;
        oldEnd--;
    }
    return node.children.length - newEnd;
}

function moveChild(node: VNode, beforeId: ID | null): ID | null {
    if (node.kind === domKind || node.kind === textKind) {
        addCommand({type: 'moveDom', id: node.id, beforeId});
        return node.id;
    }
    if (node.kind === componentKind) {
        return moveChild(node.children, beforeId);
    }
    if (node.kind === arrayKind) {
        for (let i = node.children.length - 1; i >= 0; i--) {
            const child = node.children[i] as VNode;
            beforeId = moveChild(child, beforeId);
        }
        return beforeId;
    }
    if (node.kind === portalKind) {
        // for (let i = node.children.length - 1; i >= 0; i--) {
        //     const child = node.children[i] as VNode;
        //     beforeId = moveChild(child, beforeId);
        // }
        return beforeId;
    }
    return never(node);
}
