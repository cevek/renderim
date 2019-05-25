declare global {
    namespace JSX {
        type Element = VElement;
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
