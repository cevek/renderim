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

        function update(instance: DevToolsNode) {
            const exists = devToolsNodes.get(instance._id);
            if (exists !== undefined) {
                exists._stringText = instance._stringText;
                exists._currentElement = instance._currentElement;
                if (instance._renderedComponent !== undefined) {
                    exists._renderedComponent = update(instance._renderedComponent);
                }
                exists._renderedChildren = instance._renderedChildren.map(update);
                bridge.Reconciler.receiveComponent(exists);
                return exists;
            }
            if (instance._renderedComponent !== undefined && typeof instance._currentElement !== 'string') {
                const el = (instance._currentElement as {}) as {type: Function & {displayName?: string}};
                const componentName = instance._currentElement.type;
                el.type = () => {};
                el.type.displayName = componentName;
                instance._renderedComponent = update(instance._renderedComponent);
            }
            instance._renderedChildren = instance._renderedChildren.map(update);
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
