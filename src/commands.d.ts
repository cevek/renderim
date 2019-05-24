type RootId = 'RootId';
type ID = {id: 'ID'} & number;
type Attrs = [string, string | null | undefined | {[key: string]: string}, ...unknown[]];

type Command =
    | CreateDomCommand
    | UpdateDomCommand
    | MoveDomCommand
    | RemoveDomCommand
    | CreateTextCommand
    | SetTextCommand
    | RemoveTextCommand
    | MountStartCommand
    | MountEndCommand;

type MountStartCommand = {
    type: 'mountStart';
    rootId: RootId;
};
type MountEndCommand = {
    type: 'mountEnd';
    rootId: RootId;
};

type CreateDomCommand = {
    type: 'createDom';
    id: ID;
    rootId: RootId;
    parentId: ID | RootId;
    beforeId: ID | null;
    tag: string;
    attrs: Attrs;
};

type UpdateDomCommand = {
    type: 'updateDom';
    id: ID;
    tag: string;
    attrs: Attrs;
};
type MoveDomCommand = {
    type: 'moveDom';
    id: ID;
    beforeId: ID | null;
};
type RemoveDomCommand = {
    type: 'removeDom';
    id: ID;
};
type CreateTextCommand = {
    type: 'createText';
    id: ID;
    rootId: RootId;
    parentId: ID | RootId;
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
