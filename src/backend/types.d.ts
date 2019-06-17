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
type VComponentNodeCreated = Omit<VComponentNode, 'id' | 'children' | 'parentComponent' | 'status' | 'state'> & {
    id: ID;
    children: VInput;
    parentComponent: ParentComponent;
    state: {componentId: number};
    status: VNodeStatus;
};
type VComponentNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: ID;
    readonly kind: 'component';
    readonly type: (props: object) => VInput;
    readonly props: object;
    readonly key: string | undefined;
    readonly children: VNode;
    readonly state: {componentId: number};
    readonly parentComponent: ParentComponent;
};
type VDomNodeCreated = Omit<VDomNode, 'id' | 'children' | 'parentComponent' | 'status'> & {
    id: ID;
    children: readonly VInput[];
    parentComponent: ParentComponent;
    status: VNodeStatus;
};
type VDomNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: ID;
    readonly kind: 'dom';
    readonly type: string;
    readonly props: Attrs;
    readonly key: string | undefined;
    readonly children: readonly VNode[];
    readonly state: undefined;
    readonly parentComponent: ParentComponent;
};
type VTextNodeCreated = Omit<VTextNode, 'id' | 'children' | 'parentComponent' | 'status'> & {
    id: ID;
    children: string;
    parentComponent: ParentComponent;
    status: VNodeStatus;
};
type VTextNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: ID;
    readonly kind: 'text';
    readonly type: undefined;
    readonly props: undefined;
    readonly key: undefined;
    readonly children: string;
    readonly state: undefined;
    readonly parentComponent: ParentComponent;
};
type VNodeCreatedChildren = Omit<VNode, 'children'> & {
    children: VInput[];
};
type VArrayNodeCreated = Omit<VArrayNode, 'children' | 'parentComponent' | 'status' | 'state'> & {
    children: readonly VInput[];
    parentComponent: ParentComponent;
    state: number;
    status: VNodeStatus;
};
type VArrayNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: undefined;
    readonly kind: 'array';
    readonly type: undefined;
    readonly props: undefined;
    readonly key: undefined;
    readonly children: VNode[];
    readonly state: number;
    readonly parentComponent: ParentComponent;
};
type VPortalNodeCreated = Omit<VPortalNode, 'children' | 'parentComponent' | 'status'> & {
    children: VInput;
    parentComponent: ParentComponent;
    status: VNodeStatus;
};
type VPortalNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: undefined;
    readonly kind: 'portal';
    readonly type: ID;
    readonly props: undefined;
    readonly key: undefined;
    readonly children: VNode;
    readonly state: undefined;
    readonly parentComponent: ParentComponent;
};

type CallbackWithCommand = ((...args: unknown[]) => void) & {command?: RPCCallback; extractArgs?: object[]};

type ErrorBoundaryState = {componentId: number; errors: Error[]};

type SuspenseState = {
    componentId: number;
    timeoutAt: number;
    version: number;
    components: Map<VComponentNode, Promise<unknown>>;
};
type VComponentType<
    ComponentFn extends (props: never) => VInput,
    State extends VComponentNode['state'] = VComponentNode['state']
> = VComponentNode & {
    props: Parameters<ComponentFn>[0];
    state: State;
};
