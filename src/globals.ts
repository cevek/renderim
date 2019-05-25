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

const GCVNodes = {
    cancelled: new WeakSet<VNodeCreated>(),
    obsolete: new WeakSet<VNode>(),
    removed: new WeakSet<VNode>(),
    cancelledComponents: new WeakSet<VComponentNodeCreated>(),
};
