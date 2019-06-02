type RootId = 'RootId';
type ID = {id: 'ID'} & number;
type Attrs = {[key: string]: unknown};
type Styles = {[key: string]: string};
type DeepPartial<T> = {[P in keyof T]: DeepPartial<T[P]>};

type TagCommand = CreateTagCommand | UpdateTagCommand | MoveTagCommand | RemoveTagCommand;
type TextCommand = CreateTextCommand | UpdateTextCommand | MoveTextCommand | RemoveTextCommand;
type MountCommand = MountStartCommand | MountEndCommand;
type CustomCommand = CreateCustomCommand | UpdateCustomCommand | RemoveCustomCommand;
type LoadCommand = LoadScriptCommand | LoadStyleCommand | UpdateStyleCommand;
type Command = TagCommand | TextCommand | MountCommand | CustomCommand | LoadCommand;

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
    parentId: ID;
    name: string;
    data: unknown;
    url?: string;
};
type UpdateCustomCommand = {
    group: 'custom';
    action: 'update';
    name: string;
    data: unknown;
};
type RemoveCustomCommand = {
    group: 'custom';
    parentId: ID;
    action: 'remove';
    name: string;
    data: unknown;
};

type LoadScriptCommand = {
    group: 'script';
    action: 'load';
    url: string;
    onLoad: RPCCallback;
    onError: RPCCallback;
};
type LoadStyleCommand = {
    group: 'style';
    action: 'load';
    url: string;
    onLoad: RPCCallback;
    onError: RPCCallback;
};
type UpdateStyleCommand = {
    group: 'style';
    action: 'updateAll';
};

type DomListener = {oldListener?: RPCCallback; newListener?: RPCCallback};


type RPCCommand = RPCReadCommand | RPCCallCommand | RPCWriteCommand;
type RPCCallback = {type: '__fn__'; id: string; extractArgs: object[]; returnValue?: unknown};
type RPCResult = {type: '__res__'; id: string; isError: boolean; data: unknown[]};
type RPCReadCommand = {type: 'read'; id: string; obj: ID; path: string[]; extract: object};
type RPCCallCommand = {type: 'call'; id: string; obj: ID; path: string[]; args: unknown[]; extract: object};
type RPCWriteCommand = {type: 'write'; id: string; obj: ID; path: string[]; value: unknown};