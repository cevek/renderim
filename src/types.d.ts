type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;

type Return = undefined | null | boolean | string | number | VNode | {[key: number]: Return};

type ComponentFun = (props: object) => Return;
type VNodeStatus = 'created' | 'active' | 'stalled' | 'removed';
type VChildrenNode = VDomNode | VArrayNode | VPortalNode;
type VElement = VComponentNode | VDomNode;
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
    suspense: VSuspenseNode;
    errorBoundary: VErrorBoundaryNode;
};
type VDomNode = {
    _id: number;
    status: VNodeStatus;
    id: ID;
    kind: 'dom';
    type: string;
    props: string[];
    key: string | undefined;
    children: Return[];
    extra: undefined;
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
};
