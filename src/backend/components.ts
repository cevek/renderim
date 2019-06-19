function lazy<Props extends object>(cmp: () => Promise<{default: (props: Props) => VInput}>) {
    let component: (props: Props) => VInput;
    let error: Error | undefined;
    const promise = cmp().then(m => (component = m.default), e => (error = e));
    return function Lazy(props: Props) {
        if (error !== undefined) throw error;
        if (component === undefined) throw promise;
        return createElement(component, props);
    };
}

function IntersectionObserverContainer({
    children,
    rootMargin,
    threshold,
}: {
    children: VDomNodeCreated;
    rootMargin?: string;
    threshold?: string | number;
}) {
    const child = ensureVDomNode(children);
    const withCommand: JSX.AttrsCommand = {
        name: 'IntersectionObserverContainer',
        data: {rootMargin, threshold},
    };
    return cloneVNode(child, {...child.props, withCommand}, false);
}

function IntersectionObserverElement<T extends DeepPartial<IntersectionObserverElementCallbackParams>>({
    children,
    onVisible,
    onVisibleParams,
    onInvisible,
}: {children: VDomNodeCreated} & IntersectionObserverElementProps<T>) {
    const child = ensureVDomNode(children);
    const withCommand: JSX.AttrsCommand = {
        name: 'IntersectionObserverElement',
        data: {
            onVisible: transformCallbackBackend(
                setDataToCallback(onVisible, [onVisibleParams === undefined ? ({} as T) : onVisibleParams]),
            ),
            onInvisible: onInvisible === undefined ? undefined : transformCallbackBackend(onInvisible),
        },
    };
    return cloneVNode(child, {...child.props, withCommand}, false);
}

function Suspense(props: {children: VInput; timeout: number; fallback: VInput}) {
    const currentNode = getCurrentComponentNode() as VComponentType<typeof Suspense, SuspenseState>;
    const state = currentNode.state;
    const showFallback = state.components.size > 0 && state.timeoutAt <= now;
    const fallback = showFallback ? props.fallback : null;
    const vDomChild = ensureVDomNode(props.children);
    const children = cloneVNode(vDomChild, {...vDomChild.props, hidden: state.components.size > 0}, false);
    return createElement(Boundary, {
        onCatch: (err, node) => {
            if (err instanceof Promise) {
                scheduleUpdate(() => restartComponent(state));
                setPromiseToParentSuspense(node.state, currentNode, err);
                return true;
            }
            return false;
        },
        children: [fallback, children],
    });
}

function ErrorBoundary(props: {children: VInput; fallback: (error: Error) => VInput}) {
    const currentNode = getCurrentComponentNode() as VComponentType<typeof ErrorBoundary, ErrorBoundaryState>;
    const state = currentNode.state;
    const children = state.errors.length > 0 ? props.fallback(state.errors[0]) : props.children;
    if (state.errors.length > 0) {
        state.fallbackRendered = true;
    }
    return createElement(Boundary, {
        onCatch: (err, node) => {
            if (err instanceof Error) {
                if (state.fallbackRendered) {
                    throw err;
                }
                if (state.errors.length === 0) {
                    state.errors.push(err);
                    new Promise(() => node.type(node.props)).catch(() => {});
                    scheduleUpdate(() => restartComponent(state));
                }
                return true;
            }
            return false;
        },
        children,
    });
}

function Fragment(props: {children: VInput}) {
    return props.children;
}
function Portal(props: {container: string; children: VInput}) {
    return createVPortalNode((props.container as unknown) as ID, norm(props.children));
}
type BoundaryProps = {
    children: VInput;
    onCatch: (err: Error, node: VComponentNodeCreated) => boolean;
};
function Boundary(props: BoundaryProps) {
    return props.children;
}

function ClientScript(props: {src: string | (() => Promise<unknown>)}) {
    const href = getClientScriptUrl(props.src);
    const res = clientLoadedScripts.get(href);
    if (res === true) return null;
    if (res instanceof Error) throw res;
    let resolve!: () => void;
    const promise = new Promise(res => (resolve = res));
    sendCommands([
        {
            group: 'script',
            action: 'load',
            url: href,
            onLoad: transformCallbackOnce(() => {
                resolve();
                clientLoadedScripts.set(href, true);
            }),
            onError: transformCallbackOnce(() => {
                resolve();
                clientLoadedScripts.set(href, new Error('Loading script error'));
            }),
        },
    ]);
    throw promise;
}
