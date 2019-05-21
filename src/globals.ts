let id = 0;
let _id = 0;
const commandList: Command[] = [];
const roots = new Map<ID, VNode>();
let currentComponent: VComponentNode;
let currentSuspense: VSuspenseNode;
let currentErrorBoundary: VErrorBoundaryNode;

let maybeCancelled: VNode[] = [];
let maybeRemoved: VNode[] = [];
let maybeObsolete: VNode[] = [];
let maybeRestarted: ({newNode: VComponentNode; oldNode: VComponentNode})[] = [];

const GCVNodes = {
    cancelled: new WeakSet<VNode>(),
    obsolete: new WeakSet<VNode>(),
    removed: new WeakSet<VNode>(),
    cancelledComponents: new WeakSet<VComponentNode>(),
};

const rootSuspense = Object.freeze({extra: {promises: []}}) as VSuspenseNode;
const rootErrorBoundary = Object.freeze({extra: {errors: []}}) as VErrorBoundaryNode;
