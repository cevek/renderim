class Kind {}
class ComponentKind extends Kind {}
class DomKind extends Kind {}
class TextKind extends Kind {}
class ArrayKind extends Kind {}
class PortalKind extends Kind {}

const componentKind = new ComponentKind() as 'component';
const domKind = new DomKind() as 'dom';
const textKind = new TextKind() as 'text';
const arrayKind = new ArrayKind() as 'array';
const portalKind = new PortalKind() as 'portal';