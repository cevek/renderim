type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;
type VNodeCreated = VComponentNodeCreated | VDomNodeCreated | VTextNodeCreated | VPortalNodeCreated | VArrayNodeCreated;

type VInput = undefined | null | boolean | string | number | VNodeCreated | {[key: number]: VInput};
type CommandWithParentVNode = Command & {vNode?: VNodeCreated};
type VNodeStatus = 'active' | 'obsolete' | 'removed' | 'created' | 'cancelled';

type ParentComponent =
    | VComponentNode
    | VComponentNodeCreated
    | VArrayNode
    | VArrayNodeCreated
    | VDomNode
    | VDomNodeCreated
    | VPortalNode
    | VPortalNodeCreated
    | RootId;

interface VBase {
    readonly _id: number;
    status: VNodeStatus;
    parentComponent: ParentComponent;
}

interface ComponentInstance<T = unknown> {
    parentDom: ID;
    node: VComponentNode;
    componentId: number;
    errored: boolean;
    trxId: number;
    state: T;
}

interface VComponentNodeCreated extends VBase {
    readonly kind: 'component';
    readonly type: (props: object) => VInput;
    readonly props: object;
    readonly key: string | undefined;
    children: VInput;
    instance: ComponentInstance;
}
interface VComponentNode extends VComponentNodeCreated {
    readonly children: VNode;
    readonly status: VNodeStatus;
    readonly instance: ComponentInstance;
    readonly parentComponent: ParentComponent;
}

interface VDomNodeCreated extends VBase {
    readonly kind: 'dom';
    readonly type: string;
    readonly props: Attrs;
    readonly key: string | undefined;
    instance: ID;
    children: readonly VInput[];
}

interface VDomNode extends VDomNodeCreated {
    readonly instance: ID;
    readonly children: readonly VNode[];
    readonly parentComponent: ParentComponent;
    readonly status: VNodeStatus;
}

interface VTextNodeCreated extends VBase {
    readonly kind: 'text';
    readonly type: undefined;
    readonly props: undefined;
    readonly key: undefined;
    instance: ID;
    children: string;
}
interface VTextNode extends VTextNodeCreated {
    readonly instance: ID;
    readonly children: string;
    readonly parentComponent: ParentComponent;
    readonly status: VNodeStatus;
}
interface VArrayNodeCreated extends VBase {
    readonly kind: 'array';
    readonly type: undefined;
    readonly props: undefined;
    readonly key: undefined;
    children: readonly VInput[];
    instance: number;
}
interface VArrayNode extends VArrayNodeCreated {
    readonly status: VNodeStatus;
    readonly children: VNode[];
    readonly instance: number;
    readonly parentComponent: ParentComponent;
}
interface VPortalNodeCreated extends VBase {
    readonly kind: 'portal';
    readonly type: undefined;
    readonly props: undefined;
    readonly key: undefined;
    readonly instance: ID;
    children: VInput;
}
interface VPortalNode extends VPortalNodeCreated {
    readonly children: VNode;
    readonly status: VNodeStatus;
    readonly parentComponent: ParentComponent;
}

type VNodeCreatedChildren = Omit<VNodeCreated, 'children'> & {
    children: VInput[];
};

type CallbackWithCommand = ((...args: unknown[]) => void) & {command?: RPCCallback; extractArgs?: object[]};

interface ErrorBoundaryState {
    errors: Error[];
    fallbackRendered: boolean;
}

interface SuspenseState {
    timeoutAt: number;
    version: number;
    components: Map<ComponentInstance, Promise<unknown>>;
}
type VComponentType<ComponentFn extends (props: never) => VInput> = VComponentNode & {
    props: Parameters<ComponentFn>[0];
};
