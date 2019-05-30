let id = 0;
let _id = 0;
let commandList: Command[] = [];
const roots = new Map<RootId, VNode>();
let currentComponent: VComponentNode | VComponentNodeCreated;
// let currentRootId: string | undefined;

let maybeCancelled: VNodeCreated[] = [];
let maybeRemoved: VNode[] = [];
let maybeObsolete: VNode[] = [];
let maybeRestarted: ({newNode: VComponentNode; oldNode: VComponentNode})[] = [];
let maybeUpdatedParent: ({node: VNode; newParent: VComponentNode | VComponentNodeCreated})[] = [];

let isCustomUrlCall = false;
const GCVNodes = {
    cancelled: new WeakSet<VNodeCreated>(),
    obsolete: new WeakSet<VNode>(),
    removed: new WeakSet<VNode>(),
    cancelledComponents: new WeakSet<VComponentNodeCreated>(),
};

const kindParent = {type: 'kind'};
const componentKind = ({kind: 'component', parent: kindParent} as unknown) as 'component';
const domKind = ({kind: 'dom', parent: kindParent} as unknown) as 'dom';
const textKind = ({kind: 'text', parent: kindParent} as unknown) as 'text';
const arrayKind = ({kind: 'array', parent: kindParent} as unknown) as 'array';
const portalKind = ({kind: 'portal', parent: kindParent} as unknown) as 'portal';
