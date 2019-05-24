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

function renderCommand(command: Command) {
    switch (command.type) {
        case 'createDom': {
            const parentNode = getParentNode(command.parentId);
            const nodeIsSVG = isSvg(command.tag, parentNode);
            let node;
            let beforeNode = getBeforeNode(command.beforeId);
            if (hydrating) {
                const nextNode = hydrateMap.get(parentNode) || parentNode.firstChild;
                if (nextNode !== null) {
                    if (nextNode.nodeType === 8 && nextNode.nodeValue === 'n') {
                        hydrateMap.set(parentNode, nextNode.nextSibling);
                    } else if (nextNode.nodeType === 1 && (nextNode as HTMLElement).localName === command.tag) {
                        node = nextNode as HTMLElement;
                        hydrateMap.set(parentNode, nextNode.nextSibling);
                    }
                }
                if (node === undefined) {
                    beforeNode = nextNode;
                }
            }
            if (node === undefined) {
                node = nodeIsSVG ? document.createElementNS(svgNS, command.tag) : document.createElement(command.tag);
                parentNode.insertBefore(node, beforeNode);
            }
            setNode(command.id, node);
            // todo: hydrate props diff
            for (let i = 0; i < command.props.length; i += 2) {
                const prop = command.props[i] as string;
                const value = command.props[i + 1] as unknown;
                if (prop === 'style') {
                    const style = value as CSSStyleDeclaration;
                    for (const styleProp in style) {
                        node.style[styleProp] = style[styleProp];
                    }
                } else if (prop === 'xlinkHref') {
                    node.setAttributeNS(xlinkNS, 'xlink:href', String(value));
                } else {
                    node.setAttribute(prop, String(value));
                }
            }
            break;
        }
        case 'createText': {
            let node;
            let beforeNode = getBeforeNode(command.beforeId);
            const parentNode = getParentNode(command.parentId);
            if (hydrating) {
                const nextNode = hydrateMap.get(parentNode) || parentNode.firstChild;
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
            for (let i = 0; i < command.props.length; i += 2) {
                const prop = command.props[i] as string;
                const value = command.props[i + 1] as unknown;
                if (prop === 'style') {
                    const style = value as CSSStyleDeclaration;
                    for (const styleProp in style) {
                        node.style[styleProp] = style[styleProp];
                    }
                } else if (value === null) {
                    node.removeAttribute(prop);
                } else {
                    node.setAttribute(prop, value as string);
                }
            }
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

    function getParentNode(id: string | ID) {
        return typeof id === 'string' ? document.getElementById(id)! : domMap[id];
    }
    function getBeforeNode(id: ID | null) {
        return id === null ? null : domMap[id];
    }
}

function never(val: never): never {
    throw new Error('Never possible: ' + val);
}
