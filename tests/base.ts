/// <reference path="../index.d.ts" />
import {setHook, render as Render, getNodeRootId} from 'renderim';
self.postMessage = () => {};

setHook('beforeComponent', () => {});
setHook('afterComponent', () => {});
console.log = () => {};
const queue = new Map<string, Item[]>();
setHook('restartComponent', node => {
    queue.get(getNodeRootId(node))!.push(makeTree(node) as Item);
});

type Item = {type: string; props: object; children: (Item | string)[]};
function makeTree(node: JSX.Element): Item | string {
    let type;
    if (typeof node === 'boolean' || node === null || node === undefined) return '';
    if (typeof node === 'number' || typeof node === 'string') return node;
    if (typeof node.type === 'string') {
        type = node.type;
    } else if (typeof node.type === 'function') {
        type = node.type.name;
    } else if (Array.isArray(node.children)) {
        return (node.children.map(makeTree) as {}) as Item;
    } else {
        return String(node.children);
    }
    const children = Array.isArray(node.children) ? node.children.map(makeTree) : [makeTree(node.children!)];
    return {
        type,
        props: {},
        children: children.flat(1000).filter(item => (typeof item === 'string' ? item !== '' : true)),
    };
}

function treeToString(item: Item | string, level = 0): string {
    const ident = '   '.repeat(level);
    if (typeof item === 'string') return `${ident}${item}`;
    const children = item.children.map(child => treeToString(child, level + 1));
    if (children.length === 0) return `${ident}<${item.type}/>`;
    return `${ident}<${item.type}>\n${children.join('\n')}\n${ident}</${item.type}>`;
}

let globalId = 0;
export function render(node: JSX.Element) {
    globalId++;
    const rootId = '#' + globalId;
    queue.set(rootId, []);
    function getNextRestartedComponent() {
        const el = queue.get(rootId)!.shift();
        if (el === undefined) return;
        return treeToString(el);
    }

    const root = Render(node, '#' + globalId);
    if (root === undefined) return {tree: undefined, getNextRestartedComponent};
    const tree = makeTree(root);
    return {tree: treeToString(tree), getNextRestartedComponent};
}

export function createLoadData() {
    let data: Promise<unknown> | string;
    return function Data({ms}: {ms: number}) {
        if (data === undefined) {
            data = new Promise(res => {
                return setTimeout(() => {
                    data = 'data';
                    res();
                }, ms);
            });
        }
        if (data instanceof Promise) throw data;
        return (data as {}) as JSX.Element;
    };
}
