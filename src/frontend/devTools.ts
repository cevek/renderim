declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: {inject(bridge: {}): void};

function initDevTools() {
    if (process.env.NODE_ENV === 'development' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
        const roots: {[key: string]: DevToolsNode} = {};
        const devToolsNodes = new Map<number, DevToolsNode>();
        const bridge = {
            ComponentTree: {
                getNodeFromInstance(instance: DevToolsNode) {
                    return getNode(instance._id as ID);
                },
                getClosestInstanceFromNode(node: HTMLElementWithId) {
                    node._id;
                    const devToolsNode = devToolsNodes.get(node._id);
                    if (devToolsNode === undefined) throw nevr();
                    return devToolsNode;
                },
            },
            Mount: {
                _instancesByReactRootID: roots,
                _renderNewRootComponent(instance: DevToolsNode) {
                    return instance;
                },
            },
            Reconciler: {
                mountComponent(instance: DevToolsNode) {},
                performUpdateIfNecessary(instance: DevToolsNode) {},
                receiveComponent(instance: DevToolsNode) {},
                unmountComponent(instance: DevToolsNode) {},
            },
        };
        __REACT_DEVTOOLS_GLOBAL_HOOK__.inject(bridge);

        function createFunctionWithName(name: string) {
            const obj = {[name]: function() {}};
            const fn = obj[name];
            return fn;
        }

        function update(instance: DevToolsNode) {
            if (typeof instance._currentElement !== 'string') {
                const {props} = instance._currentElement;
                for (const prop in props) {
                    const value = props[prop];
                    if (isObject<{__fn: string}>(value) && typeof value.__fn === 'string') {
                        props[prop] = createFunctionWithName(value.__fn);
                    }
                }
            }
            instance._renderedChildren = instance._renderedChildren.map(update);
            if (instance._renderedComponent !== undefined) {
                instance._renderedComponent = update(instance._renderedComponent);
                if (typeof instance._currentElement !== 'string') {
                    const el = instance._currentElement;
                    el.type = createFunctionWithName(String(el.type));
                }
            }
            const exists = devToolsNodes.get(instance._id);
            if (exists !== undefined) {
                exists._stringText = instance._stringText;
                exists._currentElement = instance._currentElement;
                exists._renderedComponent = instance._renderedComponent;
                exists._renderedChildren = instance._renderedChildren;
                bridge.Reconciler.receiveComponent(exists);
                return exists;
            }
            bridge.Reconciler.mountComponent(instance);
            devToolsNodes.set(instance._id, instance);
            return instance;
        }

        return (command: DevtoolsCommand) => {
            if (command.action === 'update') {
                if (command.node !== undefined) {
                    update(command.node);
                    if (command.isRoot) {
                        roots[command.node._id] = command.node;
                        bridge.Mount._renderNewRootComponent(command.node);
                    }
                } else if (command.isRoot) {
                    delete roots[command.unmounted[0]];
                }
            } else {
                nevr(command.action);
            }
            for (const unmounted of command.unmounted) {
                const devToolsNode = devToolsNodes.get(unmounted);
                if (devToolsNode === undefined) throw nevr();
                bridge.Reconciler.unmountComponent(devToolsNode);
            }
        };
    }
    return () => {};
}
