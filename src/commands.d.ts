type ID = {id: 'ID'} & number;

type Command =
    | CreateDomCommand
    | UpdateDomCommand
    | MoveDomCommand
    | RemoveDomCommand
    | CreateTextCommand
    | SetTextCommand
    | RemoveTextCommand;
type CreateDomCommand = {
    type: 'createDom';
    id: ID;
    parentId: ID | string;
    beforeId: ID | null;
    tag: string;
    props: (string | number)[];
};

type UpdateDomCommand = {
    type: 'updateDom';
    id: ID;
    props: (string | null)[];
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
    parentId: ID | string;
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
