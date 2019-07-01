function lazy<Props extends object>(cmp: () => Promise<{default: (props: Props) => VInput}>) {
    let component: (props: Props) => VInput;
    let error: Error | undefined;
    let promise: Promise<unknown> | undefined;
    return function Lazy(props: Props) {
        if (promise === undefined) {
            promise = cmp().then(m => (component = m.default), e => (error = e));
        }
        if (error !== undefined) throw error;
        if (component === undefined) throw promise;
        return createElement(component, props);
    };
}

function client<T>(
    cmp: () => Promise<{default: (node: {}, props: T) => {update(newProps: T): void; destroy?: () => void}}>,
) {
    return function ClientComponent(props: T) {
        const url = loadClientScript(cmp);
        const onResolve = transformCallbackOnce(() => {
            // state.promise = 'resolved';
            // resolve();
        });
        const onError = transformCallbackOnce(() => {});
        // const component = getCurrentComponentNode();
        // const state = component.state as {promise?: Promise<unknown> | 'resolved'};

        // let resolve: () => void;
        // if (state.promise === undefined) {
        //     const promise = new Promise(res => (resolve = res));
        //     state.promise = promise;
        //     throw promise;
        // }
        // if (state.promise !== 'resolved') throw state.promise;

        return createElement('div', {
            withCommand: {
                data: {
                    url,
                    props,
                    onResolve,
                    onError,
                },
                name: 'clientComponent',
            },
        });
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

function IntersectionObserverElement({
    children,
    onVisible,
    onVisibleParams,
    onInvisible,
}: {
    children: VDomNodeCreated;
    onVisible: (params: object) => void;
    onInvisible?: () => void;
    onVisibleParams?: object;
}) {
    const child = ensureVDomNode(children);
    const withCommand: JSX.AttrsCommand = {
        name: 'IntersectionObserverElement',
        data: {
            onVisible: transformCallbackBackend(
                setDataToCallback(onVisible, [onVisibleParams === undefined ? {} : onVisibleParams]),
            ),
            onInvisible: onInvisible === undefined ? undefined : transformCallbackBackend(onInvisible),
        },
    };
    return cloneVNode(child, {...child.props, withCommand}, false);
}

function Suspense(props: {children: VInput; timeout: number; fallback: VInput}) {
    const suspenseState = getCurrentComponent<SuspenseState>();
    const showFallback = suspenseState.components.size > 0 && suspenseState.timeoutAt <= now;
    const fallback = showFallback ? props.fallback : null;
    const vDomChild = ensureVDomNode(props.children);
    const children = cloneVNode(vDomChild, {...vDomChild.props, hidden: suspenseState.components.size > 0}, false);
    return createElement(Boundary, {
        onCatch: (err, node) => {
            if (err instanceof Promise) {
                scheduleUpdate(() => restartComponent(suspenseState));
                setPromiseToParentSuspense(node.state, suspenseState, props.timeout, err);
                return true;
            }
            return false;
        },
        children: [fallback, children],
    });
}

function ErrorBoundary(props: {children: VInput; fallback: (error: Error) => VInput}) {
    const state = getCurrentComponent<ErrorBoundaryState>();
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
    onSubcomponentErrorGone?: (node: VComponentNodeCreated) => boolean;
    onSubcomponentRemoved?: (node: VComponentNodeCreated) => boolean;
};
function Boundary(props: BoundaryProps) {
    return props.children;
}

function loadClientScript(src: string | (() => Promise<unknown>)): string {
    const res = clientScripts.get(src);
    if (res instanceof Promise) throw res;
    if (res instanceof Error) throw res;
    if (res !== undefined) return res;

    if (typeof src === 'string') {
        let resolve!: () => void;
        const promise = new Promise(res => (resolve = res));
        const load = () => {
            clientScripts.set(src, 'loaded');
            resolve();
        };
        sendCommands([
            {
                group: 'script',
                action: 'load',
                url: src,
                onLoad: transformCallbackOnce(load),
                onError: transformCallbackOnce(load),
            },
        ]);
        throw promise;
    }
    throw src().catch(err => {
        const m = err.message.match(/^Cannot find module '(.*?)'$/);
        if (m !== null) {
            clientScripts.set(src, m[1]);
        } else {
            throw err;
        }
    });
}
