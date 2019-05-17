type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;

type Return = undefined | null | boolean | string | number | VNode | {[key: number]: Return};

type ComponentFun = (props: object) => Return;

type VChildrenNode = VDomNode | VArrayNode | VPortalNode;
type VElement = VComponentNode | VDomNode;
type VComponentNode = {
    id: ID;
    kind: 'component';
    type: (props: object) => Return;
    props: object;
    key: string | undefined;
    children: VNode;
};
type VDomNode = {
    id: ID;
    kind: 'dom';
    type: string;
    props: string[];
    key: string | undefined;
    children: Return[];
};
type VTextNode = {
    id: ID;
    kind: 'text';
    type: undefined;
    props: undefined;
    key: undefined;
    children: string;
};
type VArrayNode = {
    id: undefined;
    kind: 'array';
    type: undefined;
    props: undefined;
    key: undefined;
    children: Return[];
};
type VPortalNode = {
    id: undefined;
    kind: 'portal';
    type: ID;
    props: undefined;
    key: undefined;
    children: Return[];
};
