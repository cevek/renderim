declare global {
    namespace JSX {
        // tslint:disable-next-line:no-empty-interface
        interface Element extends VComponentNode {}
        interface ElementClass {}
        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }

        interface IntrinsicAttributes {}
        interface IntrinsicClassAttributes<T> {}

        interface IntrinsicElements {
            [key: string]: any;
        }
    }
}

export {};
