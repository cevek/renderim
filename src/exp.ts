
function ResizeObserver(props: {children: VNode; onResize: () => void}) {
    return props.children;
}

function InsersectionObserver(props: {rootMargin: string; threshold: number; children: VDomNode}) {
    return props.children;
}

function InsersectionObserverTarget(props: {children: VNode; onIntersection: () => void}) {
    return props.children;
}

function Scrollable(props: {children: VNode; onScroll: () => void}) {
    const vDomNode = findFirstVDomNodeInProps(props.children);
    // vDomNode.props.onScroll = props.onScroll;
    return props.children;
}

function findFirstVDomNodeInProps(node: VInput): VDomNodeCreated {
    if (isVNode(node)) {
        if (node.kind === domKind) {
            return node;
        }
        if (node.kind === componentKind) {
            return findFirstVDomNodeInProps((node.props as {children?: VInput}).children);
        }
    }
    throw new AssertError('You can provide only element or components with one child');
}

function Doc(props: {}) {}
function Win(props: {}) {}

type API = {
    requestAnimationFrame(): void;
    scrollIntoView(): void;
    localStorage(): void;
    sessionStorage(): void;
    requestFullScreen(): void;
    indexedDB(): void;
    crypto(): void;
    alert(): void;
    matchMedia(): void;
    history: {go(x: number): void; back(): void};
};

function callMethods<T>(path: unknown[], params: unknown[], resultShape?: object) {
    return Promise.resolve({} as T);
}

function ScrollIntoView(props: {
    children: VNode;
    smooth?: boolean;
    block?: 'start' | 'center' | 'end' | 'nearest';
    inline?: 'start' | 'center' | 'end' | 'nearest';
}) {
    return props.children;
}
