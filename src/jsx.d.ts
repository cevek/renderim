declare global {
    namespace JSX {
        // tslint:disable-next-line:no-empty-interface
        interface Element extends VElement {}
        interface ElementClass {}
        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }

        interface IntrinsicAttributes {
            key?: string | number;
        }
        interface IntrinsicClassAttributes<T> {}

        interface IntrinsicElements {
            [key: string]: any;
        }
    }
}

export {};
