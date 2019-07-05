// const devToolsNodes = new Map<number, DevToolsNode>();

// let devToolsId = 0;

let convertVNodeToDevToolsJSON = (node: VNode): DevToolsNode => undefined!;
if (process.env.NODE_ENV === 'development') {
    function convertProps(props: unknown): unknown {
        type Hash = {[key: string]: Hash | string};
        if (isVNode(props)) return 'VNode';
        if (isObj<Hash>(props)) {
            const newObj: Hash = {};
            if (Array.isArray(props)) return props.map(convertProps);
            for (const prop in props) {
                const value = props[prop];
                try {
                    // could be maximum callstack
                    newObj[prop] = convertProps(value) as Hash;
                } catch (err) {
                    console.warn(err);
                }
            }
            return newObj;
        }
        if (typeof props === 'function') return {__fn: `${(props as Function).name}`};
        return props;
    }
    convertVNodeToDevToolsJSON = function convertVNodeToDevToolsJSON(node: VNode): DevToolsNode {
        let stringText;
        let children: DevToolsNode[] = [];
        let currentElement;
        let renderedComponent;
        let instance = {};
        const props = convertProps(node.props) as {[key: string]: unknown};
        if (node.kind === COMPONENT_KIND) {
            children = [];
            if (node.type === Fragment) {
                currentElement = {type: '#fragment', props};
                if (node.children.kind === ARRAY_KIND) {
                    children = node.children.children.map(convertVNodeToDevToolsJSON);
                }
            } else if (node.type === Portal && node.children.kind === PORTAL_KIND) {
                currentElement = {type: '#portal', props};
                if (node.children.children.kind === ARRAY_KIND) {
                    children = node.children.children.children.map(convertVNodeToDevToolsJSON);
                }
            } else {
                currentElement = {type: node.type.name, props};
                renderedComponent = convertVNodeToDevToolsJSON(node.children);
            }
        } else if (node.kind === DOM_KIND) {
            currentElement = {type: node.type, props};
            children = node.children.map(convertVNodeToDevToolsJSON);
        } else if (node.kind === ARRAY_KIND) {
            currentElement = {type: '#array', props: {}};
            children = node.children.map(convertVNodeToDevToolsJSON);
        } else if (node.kind === PORTAL_KIND) {
            currentElement = {type: '#portal', props: {}};
        } else if (node.kind === TEXT_KIND) {
            currentElement = String(node.children);
            stringText = String(node.children);
        } else {
            return never(node);
        }
        const id = getPersistId(node);
        return {
            _id: id,
            _rootNodeID: findRootId(node),
            _nodeId: findChildVDom(node).instance,
            _stringText: stringText,
            _instance: instance,
            _currentElement: currentElement,
            _renderedChildren: children,
            _renderedComponent: renderedComponent,
        };
    };
}
