type ID = {id: 'ID'};
type VNode = VComponentNode | VDomNode | VTextNode | VPortalNode | VArrayNode;

type Return = undefined | null | boolean | string | number | VNode | {[key: number]: Return};

type VComponentNode = {
    id: ID;
    kind: typeof componentKind;
    type: (props: object) => Return;
    props: object;
    key: string | undefined;
    children: VNode;
};
type VDomNode = {
    id: ID;
    kind: typeof domKind;
    type: string;
    props: string[];
    key: string | undefined;
    children: Return[];
};
type VTextNode = {
    id: ID;
    kind: typeof textKind;
    type: undefined;
    props: undefined;
    key: undefined;
    children: string;
};
type VArrayNode = {
    id: undefined;
    kind: typeof arrayKind;
    type: undefined;
    props: undefined;
    key: undefined;
    children: Return[];
};
type VPortalNode = {
    id: undefined;
    kind: typeof portalKind;
    type: ID;
    props: undefined;
    key: undefined;
    children: Return[];
};

type Command =
    | CreateDomCommand
    | UpdateDomCommand
    | RemoveDomCommand
    | CreateTextCommand
    | SetTextCommand
    | RemoveTextCommand;
type CreateDomCommand = {
    type: 'createDom';
    id: ID;
    parentId: ID;
    beforeId: ID | null;
    tag: string;
    props: (string | number)[];
};
type UpdateDomCommand = {
    type: 'updateDom';
    id: ID;
    props: (string | null)[];
};
type RemoveDomCommand = {
    type: 'removeDom';
    id: ID;
};
type CreateTextCommand = {
    type: 'createText';
    id: ID;
    parentId: ID;
    beforeId: ID | null;
    text: string;
};
type SetTextCommand = {
    type: 'setText';
    id: ID;
    text: string;
};
type RemoveTextCommand = {
    type: 'removeText';
    id: ID;
};
