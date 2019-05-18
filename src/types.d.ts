type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;

type Return = undefined | null | boolean | string | number | VNode | {[key: number]: Return};

type ComponentFun = (props: object) => Return;

type VChildrenNode = VDomNode | VArrayNode | VPortalNode;
type VElement = VComponentNode | VDomNode;
type VSuspenseNode = VComponentNode & {props: SuspenseProps; extra: SuspenseExtra};
type VErrorBoundaryNode = VComponentNode & {props: ErrorBoundaryProps};
type VComponentNode = {
    id: ID;
    kind: 'component';
    type: ComponentFun;
    props: object;
    key: string | undefined;
    children: VNode;
    extra: unknown;
};
type VDomNode = {
    id: ID;
    kind: 'dom';
    type: string;
    props: string[];
    key: string | undefined;
    children: Return[];
    extra: undefined;
};
type VTextNode = {
    id: ID;
    kind: 'text';
    type: undefined;
    props: undefined;
    key: undefined;
    children: string;
    extra: undefined;
};
type VArrayNode = {
    id: undefined;
    kind: 'array';
    type: undefined;
    props: undefined;
    key: undefined;
    children: Return[];
    extra: undefined;
};
type VPortalNode = {
    id: undefined;
    kind: 'portal';
    type: ID;
    props: undefined;
    key: undefined;
    children: Return[];
    extra: undefined;
};
