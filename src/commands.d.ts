type RootId = 'RootId';
type ID = {id: 'ID'} & number;
type Attrs = {[key: string]: unknown};
type Styles = {[key: string]: string};

type TagCommand = CreateTagCommand | UpdateTagCommand | MoveTagCommand | RemoveTagCommand;
type TextCommand = CreateTextCommand | UpdateTextCommand | MoveTextCommand | RemoveTextCommand;
type MountCommand = MountStartCommand | MountEndCommand;
type CustomCommand = CreateCustomCommand | UpdateCustomCommand | MoveCustomCommand | RemoveCustomCommand;
type Command = TagCommand | TextCommand | MountCommand | CustomCommand;

type MountStartCommand = {
    group: 'mount';
    action: 'start';
    rootId: RootId;
};
type MountEndCommand = {
    group: 'mount';
    action: 'end';
    rootId: RootId;
};

type CreateTagCommand = {
    group: 'tag';
    action: 'create';
    id: ID;
    rootId: RootId;
    parentId: ID | RootId;
    beforeId: ID | null;
    tag: string;
    attrs: Attrs;
};

type UpdateTagCommand = {
    group: 'tag';
    action: 'update';
    tag: string;
    id: ID;
    attrs: Attrs;
};
type MoveTagCommand = {
    group: 'tag';
    action: 'move';
    tag: string;
    id: ID;
    beforeId: ID | null;
};
type RemoveTagCommand = {
    group: 'tag';
    action: 'remove';
    tag: string;
    id: ID;
};

type MoveTextCommand = {
    group: 'text';
    action: 'move';
    id: ID;
    beforeId: ID | null;
};
type CreateTextCommand = {
    group: 'text';
    action: 'create';
    id: ID;
    rootId: RootId;
    parentId: ID | RootId;
    beforeId: ID | null;
    text: string;
};
type UpdateTextCommand = {
    group: 'text';
    action: 'update';
    id: ID;
    text: string;
};
type RemoveTextCommand = {
    group: 'text';
    action: 'remove';
    id: ID;
};

type CreateCustomCommand = {
    group: 'custom';
    action: 'create';
    id: ID;
    rootId: RootId;
    parentId: ID | RootId;
    beforeId: ID | null;
    name: string;
    data: unknown;
};
type UpdateCustomCommand = {
    group: 'custom';
    action: 'update';
    id: ID;
    name: string;
    data: unknown;
};
type MoveCustomCommand = {
    group: 'custom';
    action: 'move';
    name: string;
    data: unknown;
    id: ID;
    beforeId: ID | null;
};
type RemoveCustomCommand = {
    group: 'custom';
    action: 'remove';
    name: string;
    data: unknown;
    id: ID;
};
