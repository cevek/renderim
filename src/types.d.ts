type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;

type Return = undefined | null | boolean | string | number | VElement | {[key: number]: Return};
type CommandWithParentVNode = Command & {vNode: VNode};

type ComponentFun = (props: object) => Return;
type VNodeStatus = 'created' | 'active' | 'obsolete' | 'removed' | 'cancelled';
type VChildrenNode = VDomNode | VArrayNode | VPortalNode;
type NoReadonly<T> = {-readonly [P in keyof T]: T[P]};
type VElement = {
    readonly _id: number;
    readonly status: string;
    readonly id: unknown;
    readonly kind: string;
    readonly type: unknown;
    readonly props: unknown;
    readonly key: unknown;
    readonly children: unknown;
    readonly extra: unknown;
    readonly parentComponent: VElement | undefined;
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
    readonly extra: unknown;
    readonly parentComponent: VComponentNode | undefined;
};
type VDomNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: ID;
    readonly kind: 'dom';
    readonly type: string;
    readonly props: Props;
    readonly key: string | undefined;
    readonly children: readonly Return[];
    readonly extra: undefined;
    readonly parentComponent: VComponentNode | undefined;
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
    readonly parentComponent: VComponentNode | undefined;
};
type VArrayNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: undefined;
    readonly kind: 'array';
    readonly type: undefined;
    readonly props: undefined;
    readonly key: undefined;
    readonly children: readonly Return[];
    readonly extra: undefined;
    readonly parentComponent: VComponentNode | undefined;
};
type VPortalNode = {
    readonly _id: number;
    readonly status: VNodeStatus;
    readonly id: undefined;
    readonly kind: 'portal';
    readonly type: ID;
    readonly props: undefined;
    readonly key: undefined;
    readonly children: readonly Return[];
    readonly extra: undefined;
    readonly parentComponent: VComponentNode | undefined;
};
