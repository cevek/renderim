type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;
type VNodeCreated = VComponentNodeCreated | VDomNodeCreated | VTextNodeCreated | VPortalNodeCreated | VArrayNodeCreated;

type VInput = undefined | void | null | boolean | string | number | VNodeCreated | {[key: number]: VInput};
type CommandWithParentVNode = Command & {vNode: VNode | VNodeCreated};
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type ComponentFun = (props: object) => VInput;
type VNodeStatus = 'active' | 'obsolete' | 'removed';
type VChildrenNode = VDomNode | VArrayNode;
type VChildrenNodeCreated = VDomNodeCreated | VArrayNodeCreated;
type NoReadonly<T> = {-readonly [P in keyof T]: T[P]};

type ParentComponent = VComponentNode | VComponentNodeCreated | RootId;
type VComponentNodeCreated = Omit<VComponentNode, 'id' | 'children' | 'parentComponent' | 'status' | 'extra'> & {
    id: ID;
    children: VInput;
    parentComponent: ParentComponent;
    extra: object;
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
    readonly extra: object;
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
    readonly extra: undefined;
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
    readonly extra: undefined;
    readonly parentComponent: ParentComponent;
};
type VArrayNodeCreated = Omit<VArrayNode, 'children' | 'parentComponent' | 'status'> & {
    children: VInput[];
    parentComponent: ParentComponent;
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
    readonly extra: undefined;
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
    readonly extra: undefined;
    readonly parentComponent: ParentComponent;
};

declare const exports: {[key: string]: unknown};
type CallbackWithCommand = ((...args: unknown[]) => void) & {command?: RPCCallback; extractArgs?: object[]};
