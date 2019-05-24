/// <reference path="../commands.d.ts" />

const domMap: Node[] = [];
const svgNS = 'http://www.w3.org/2000/svg';
const xlinkNS = 'http://www.w3.org/1999/xlink';
let hydrating = true;
const hydrateMap = new Map<Node, Node | null>();

function isSvg(tag: string, node: Node) {
    return (
        tag === 'svg' ||
        (tag !== 'div' &&
            tag !== 'span' &&
            tag !== 'td' &&
            tag !== 'tr' &&
            tag !== 'li' &&
            tag !== 'h1' &&
            tag !== 'h2' &&
            tag !== 'h3' &&
            tag !== 'i' &&
            tag !== 'u' &&
            tag !== 'b' &&
            tag !== 'strong' &&
            tag !== 'em' &&
            tag !== 'img' &&
            node.namespaceURI === svgNS)
    );
}

function setNode(id: ID, node: Node) {
    if (domMap.length <= id) {
        for (let i = domMap.length; i <= id; i++) domMap.push(undefined!);
    }
    domMap[id] = node;
}

function renderCommands(commands: Command[]) {
    for (let i = 0; i < commands.length; i++) {
        renderCommand(commands[i]);
    }
}

function endHydrate() {
    if (hydrating) {
        hydrating = false;
        for (const [parentNode, nextNode] of hydrateMap) {
            let n = nextNode;
            while (n !== null) {
                parentNode.removeChild(n);
                n = n.nextSibling;
            }
        }
        hydrateMap.clear();
    }
}

function createDom(command: CreateDomCommand) {
    const parentNode = getParentNode(command.parentId);
    const nodeIsSVG = isSvg(command.tag, parentNode);
    let node;
    let beforeNode = getBeforeNode(command.beforeId);
    if (hydrating) {
        let nextNode = hydrateMap.get(parentNode);
        if (nextNode === undefined) {
            nextNode = parentNode.firstChild;
            hydrateMap.set(parentNode, nextNode);
        }
        if (nextNode !== null) {
            if (nextNode.nodeType === 8 && nextNode.nodeValue === 'n') {
                hydrateMap.set(parentNode, nextNode.nextSibling);
            } else if (nextNode.nodeType === 1 && (nextNode as HTMLElement).localName === command.tag) {
                node = nextNode as HTMLElement;
                hydrateMap.set(parentNode, nextNode.nextSibling);
                const diff = createDiffFromRealDom(node, command.attrs);
                setAttrs(node, diff);
            }
        }
        if (node === undefined) {
            beforeNode = nextNode;
        }
    }
    if (node === undefined) {
        node = nodeIsSVG
            ? ((document.createElementNS(svgNS, command.tag) as Node) as HTMLElement)
            : document.createElement(command.tag);
        parentNode.insertBefore(node, beforeNode);
        if (hydrating) {
            hydrateMap.set(node, null);
        }
        setAttrs(node, command.attrs);
    }
    setNode(command.id, node);
}

function createText(command: CreateTextCommand) {
    let node;
    let beforeNode = getBeforeNode(command.beforeId);
    const parentNode = getParentNode(command.parentId);
    if (hydrating) {
        let nextNode = hydrateMap.get(parentNode);
        if (nextNode === undefined) {
            nextNode = parentNode.firstChild;
            hydrateMap.set(parentNode, nextNode);
        }
        if (nextNode !== null) {
            if (nextNode.nodeType === 8 && nextNode.nodeValue === 'n') {
                hydrateMap.set(parentNode, nextNode.nextSibling);
            } else if (nextNode.nodeType === 3) {
                if (nextNode.nodeValue !== command.text) {
                    nextNode.nodeValue = command.text;
                }
                node = nextNode as HTMLElement;
                const nextNextNode = node.nextSibling;
                if (nextNextNode !== null && nextNextNode.nodeType === 8 && nextNextNode.nodeValue === '') {
                    hydrateMap.set(parentNode, nextNextNode.nextSibling);
                } else {
                    hydrateMap.set(parentNode, nextNextNode);
                }
            }
        }
        if (node === undefined) {
            beforeNode = nextNode;
        }
    }
    if (node === undefined) {
        node = document.createTextNode(command.text);
        getParentNode(command.parentId).insertBefore(node, beforeNode);
    }
    setNode(command.id, node);
}

function renderCommand(command: Command) {
    switch (command.type) {
        case 'createDom': {
            createDom(command);
            break;
        }
        case 'createText': {
            createText(command);
            break;
        }
        case 'moveDom': {
            endHydrate();
            const node = domMap[command.id];
            const beforeNode = command.beforeId === null ? null : domMap[command.beforeId];
            node.parentNode!.insertBefore(node, beforeNode);
            break;
        }
        case 'updateDom': {
            endHydrate();
            const node = domMap[command.id] as HTMLElement;
            setAttrs(node, command.attrs);
            break;
        }
        case 'setText': {
            endHydrate();
            const node = domMap[command.id];
            node.nodeValue = command.text;
            break;
        }
        case 'removeDom': {
            endHydrate();
            const node = domMap[command.id];
            node.parentNode!.removeChild(node);
            domMap[command.id] = undefined!;
            break;
        }
        case 'removeText': {
            endHydrate();
            const node = domMap[command.id];
            node.parentNode!.removeChild(node);
            domMap[command.id] = undefined!;
            break;
        }
        default: {
            never(command);
        }
    }
}

function getParentNode(id: string | ID) {
    return typeof id === 'string' ? document.getElementById(id)! : domMap[id];
}
function getBeforeNode(id: ID | null) {
    return id === null ? null : domMap[id];
}

function never(val: never): never {
    throw new Error('Never possible: ' + val);
}
