
function lazy<P, T extends (props: P) => VInput>(cmp: () => Promise<{default: T}>) {
    let component: T;
    let error: Error | undefined;
    const promise = cmp().then(m => (component = m.default), e => (error = e));
    return function Lazy(props: P) {
        if (error !== undefined) throw error;
        if (component === undefined) throw promise;
        return createElement((component as unknown) as ComponentFun, props as {});
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
    const customChild: JSX.CustomChild = {
        name: 'IntersectionObserverContainer',
        data: {rootMargin, threshold},
    };
    (child as NoReadonly<VDomNodeCreated>).props = {...child.props, customChild};
    return child;
}

function IntersectionObserverElement<T extends DeepPartial<IntersectionObserverElementCallbackParams>>({
    children,
    onVisible,
    onVisibleParams,
    onInvisible,
}: {children: VDomNodeCreated} & IntersectionObserverElementProps<T>) {
    const child = ensureVDomNode(children);
    const customChild: JSX.CustomChild = {
        name: 'IntersectionObserverElement',
        data: {
            onVisible: transformCallback(
                setDataToCallback(onVisible, [onVisibleParams === undefined ? ({} as T) : onVisibleParams]),
            ),
            onInvisible: onInvisible === undefined ? undefined : transformCallback(onInvisible),
        },
    };
    (child as NoReadonly<VDomNodeCreated>).props = {...child.props, customChild};
    return child;
}

function Suspense(props: SuspenseProps) {
    return props.children;
}

function ErrorBoundary(props: ErrorBoundaryProps) {
    return props.children;
}

function Fragment(props: {children: VInput}) {
    return props.children;
}
function Portal(props: {container: string; children: VInput}) {
    return createVPortalNode((props.container as unknown) as ID, norm(props.children));
}