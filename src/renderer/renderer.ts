/// <reference path="../commands.d.ts" />

const domMap: Node[] = [];
const svgNS = 'http://www.w3.org/2000/svg';
const xlinkNS = 'http://www.w3.org/1999/xlink';

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

function renderCommand(command: Command) {
    switch (command.type) {
        case 'createDom': {
            const parentNode = getParentNode(command.parentId);
            const nodeIsSVG = isSvg(command.tag, parentNode);
            const node = nodeIsSVG ? document.createElementNS(svgNS, command.tag) : document.createElement(command.tag);
            parentNode.insertBefore(node, getBeforeNode(command.beforeId));
            setNode(command.id, node);
            for (let i = 0; i < command.props.length; i += 2) {
                const prop = command.props[i] as string;
                const value = command.props[i + 1];
                if (prop === 'xlinkHref') {
                    node.setAttributeNS(xlinkNS, 'xlink:href', String(value));
                } else {
                    node.setAttribute(prop, String(value));
                }
            }
            break;
        }
        case 'createText': {
            const node = document.createTextNode(command.text);
            setNode(command.id, node);
            getParentNode(command.parentId).insertBefore(node, getBeforeNode(command.beforeId));
            break;
        }
        case 'moveDom': {
            const node = domMap[command.id];
            const beforeNode = command.beforeId === null ? null : domMap[command.beforeId];
            node.parentNode!.insertBefore(node, beforeNode);
            break;
        }
        case 'updateDom': {
            const node = domMap[command.id] as Element;
            for (let i = 0; i < command.props.length; i += 2) {
                const prop = command.props[i] as string;
                const value = command.props[i + 1];
                if (value === null) {
                    node.removeAttribute(prop);
                } else {
                    node.setAttribute(prop, value);
                }
            }
            break;
        }
        case 'setText': {
            const node = domMap[command.id];
            node.nodeValue = command.text;
            break;
        }
        case 'removeDom': {
            const node = domMap[command.id];
            node.parentNode!.removeChild(node);
            domMap[command.id] = undefined!;
            break;
        }
        case 'removeText': {
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
