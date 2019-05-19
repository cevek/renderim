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
    skip?: true;
};

type UpdateDomCommand = {
    type: 'updateDom';
    id: ID;
    props: (string | null)[];
    skip?: true;
};
type MoveDomCommand = {
    type: 'moveDom';
    id: ID;
    beforeId: ID | null;
    skip?: true;
};
type RemoveDomCommand = {
    type: 'removeDom';
    id: ID;
    skip?: true;
};
type CreateTextCommand = {
    type: 'createText';
    id: ID;
    parentId: ID | string;
    beforeId: ID | null;
    text: string;
    skip?: true;
};
type SetTextCommand = {
    type: 'setText';
    id: ID;
    text: string;
    skip?: true;
};
type RemoveTextCommand = {
    type: 'removeText';
    id: ID;
    skip?: true;
};
