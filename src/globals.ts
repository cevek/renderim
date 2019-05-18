let id = 0;
const defaultProps = {};
const commandList: Command[] = [];
let currentComponent: VComponentNode;
const roots = new Map<ID, VComponentNode | VDomNode>();
// let lastComponentError:Error | undefined;
const suspensePromises: Promise<unknown>[] = [];
