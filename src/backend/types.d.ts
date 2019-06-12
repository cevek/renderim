type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;
type VNodeCreated = VComponentNodeCreated | VDomNodeCreated | VTextNodeCreated | VPortalNodeCreated | VArrayNodeCreated;

type VInput = undefined | null | boolean | string | number | VNodeCreated | {[key: number]: VInput};
type CommandWithParentVNode = Command & {vNode?: VNode | VNodeCreated};
type ComponentFun = (props: any) => VInput;
type VNodeStatus = 'active' | 'obsolete' | 'removed';
type VChildrenNode = VDomNode | VArrayNode;
type VChildrenNodeCreated = VDomNodeCreated | VArrayNodeCreated;
type NoReadonly<T> = {-readonly [P in keyof T]: T[P]};

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
    status: 'created' | 'active' | 'cancelled';
};
type VComponentNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: ID;
    readonly kind: 'component';
    readonly type: ComponentFun;
    readonly props: object;
    readonly key: string | undefined;
    readonly children: VNode;
    readonly state: {componentId: number};
    readonly parentComponent: ParentComponent;
};
type VDomNodeCreated = Omit<VDomNode, 'id' | 'children' | 'parentComponent' | 'status'> & {
    id: ID;
    children: VInput[];
    parentComponent: ParentComponent;
    status: 'created' | 'active' | 'cancelled';
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
    status: 'created' | 'active' | 'cancelled';
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
type VArrayNodeCreated = Omit<VArrayNode, 'children' | 'parentComponent' | 'status' | 'state'> & {
    children: VInput[];
    parentComponent: ParentComponent;
    state: number;
    status: 'created' | 'active' | 'cancelled';
};
type VArrayNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: undefined;
    readonly kind: 'array';
    readonly type: undefined;
    readonly props: undefined;
    readonly key: undefined;
    readonly children: readonly VNode[];
    readonly state: number;
    readonly parentComponent: ParentComponent;
};
type VPortalNodeCreated = Omit<VPortalNode, 'children' | 'parentComponent' | 'status'> & {
    children: VInput;
    parentComponent: ParentComponent;
    status: 'created' | 'active' | 'cancelled';
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

type ErrorBoundaryProps = {children: VInput; fallback: (props: {errors: Error[]}) => VInput};
type ErrorBoundaryState = {componentId: number; errors: Error[]};
type VErrorBoundaryNodeCreated = VComponentNodeCreated & {props: ErrorBoundaryProps; state: ErrorBoundaryState};

type SuspenseState = {
    componentId: number;
    timeoutAt: number;
    version: number;
    components: Map<VComponentNodeCreated, Promise<unknown>>;
};
type SuspenseProps = {children: VInput; hideIfSuspended?: boolean; timeout: number; fallback: VInput};
type VSuspenseNodeCreated = VComponentNodeCreated & {props: SuspenseProps; state: SuspenseState};
