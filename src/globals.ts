let id = 0;
let _id = 0;
const commandList: Command[] = [];
const roots = new Map<ID, VNode>();
let currentComponent: VComponentNode;
let currentSuspense: VSuspenseNode;
let currentErrorBoundary: VErrorBoundaryNode;
let restartedComponents: {new: VComponentNode; old: VComponentNode}[] = [];

const staleNodes = new WeakSet<VNode>();
const removedNodes = new WeakSet<VNode>();

const rootSuspense = Object.freeze({extra: {promises: []}}) as VSuspenseNode;
const rootErrorBoundary = (undefined as unknown) as VErrorBoundaryNode;
