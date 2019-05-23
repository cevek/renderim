type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;

type Return = undefined | null | boolean | string | number | VElement | {[key: number]: Return};
type CommandWithParentVNode = Command & {vNode: VNode};

type ComponentFun = (props: object) => Return;
type VNodeStatus = 'created' | 'active' | 'obsolete' | 'removed' | 'cancelled';
type VChildrenNode = VDomNode | VArrayNode | VPortalNode;
type VElement = {
    _id: number;
    status: string;
    id: unknown;
    kind: string;
    type: unknown;
    props: unknown;
    key: unknown;
    children: unknown;
    extra: unknown;
    parentComponent: VElement | undefined;
};
type VComponentNode = {
    _id: number;
    status: VNodeStatus;
    id: ID;
    kind: 'component';
    type: ComponentFun;
    props: object;
    key: string | undefined;
    children: VNode;
    extra: unknown;
    parentComponent: VComponentNode | undefined;
};
type VDomNode = {
    _id: number;
    status: VNodeStatus;
    id: ID;
    kind: 'dom';
    type: string;
    props: Props;
    key: string | undefined;
    children: Return[];
    extra: undefined;
    parentComponent: VComponentNode | undefined;
};
type VTextNode = {
    _id: number;
    status: VNodeStatus;
    id: ID;
    kind: 'text';
    type: undefined;
    props: undefined;
    key: undefined;
    children: string;
    extra: undefined;
    parentComponent: VComponentNode | undefined;
};
type VArrayNode = {
    _id: number;
    status: VNodeStatus;
    id: undefined;
    kind: 'array';
    type: undefined;
    props: undefined;
    key: undefined;
    children: Return[];
    extra: undefined;
    parentComponent: VComponentNode | undefined;
};
type VPortalNode = {
    _id: number;
    status: VNodeStatus;
    id: undefined;
    kind: 'portal';
    type: ID;
    props: undefined;
    key: undefined;
    children: Return[];
    extra: undefined;
    parentComponent: VComponentNode | undefined;
};
