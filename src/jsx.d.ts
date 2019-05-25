declare global {
    namespace JSX {
        type Element = VInput;
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

        type IntrinsicElements = {
            [key: string]: Base;
            input: InputType;
            textarea: BaseInput & {spellcheck?: boolean; value: string};
            select: BaseInput & {multiple?: boolean; value?: string; size?: number};
            a: Base & {href: string; rel?: string; target?: HTMLTarget};
            audio: Base & {
                src: string;
                autoplay?: boolean;
                controls?: boolean;
                loop?: boolean;
                muted?: boolean;
                preload?: 'auto' | 'metadata' | 'none';
            };
            video: IntrinsicElements['audio'] & {height?: number; width?: number; poster?: string};
            track: Base; // todo:
            source: Base; // todo:
            td: Base & {colspan?: number; rowspan?: number; headers?: string};
            th: IntrinsicElements['td'] & {abbr?: string; scope?: string; sorted?: string};
            time: Base & {datetime: string};
            style: Base & {media?: string; type?: string};
            script: Base & {async?: boolean; defer?: boolean; src?: string; type?: string};
            q: Base & {cite?: string};
            blockquote: Base & {cite?: string};
            ins: Base & {cite?: string; datetime?: string};
            del: IntrinsicElements['ins'];
            progress: Base & {max?: number; value?: number};
            param: Base & {name?: string; value?: number};
            output: Base & {name?: string; for?: string; form?: string};
            option: Base & {name?: string; value?: string; label?: string; selected?: boolean; disabled?: boolean};
            optgroup: Base & {label?: string; disabled?: boolean};
            ol: Base & {reversed?: boolean; start?: number; type?: string};
            li: Base & {value?: number};
            label: Base & {for?: string};
            map: Base & {name: string};
            meter: Base & {
                form?: string;
                high?: number;
                low?: number;
                max?: number;
                min?: number;
                optimum?: number;
                value?: number;
            };
            html: Base & {xmlns?: string};
            fieldset: Base & {disabled?: boolean; name?: string};
            dialog: Base & {open?: boolean};
            details: Base & {open?: boolean};
            data: Base & {value?: string};
            colgroup: Base & {span?: number};
            col: Base & {span?: number};
            canvas: Base & {width: number; height: number};
            button: Base & {disabled?: boolean; autofocus?: boolean; type?: 'button' | 'reset' | 'submit'};
            base: Base & {href?: string; target?: HTMLTarget};
            img: Base & {
                alt: string;
                src: string;
                crossorigin?: string;
                width?: number;
                height?: number;
                srcset?: string;
                usemap?: string;
            };
            form: Base & {
                'accept-charset'?: string;
                action?: string;
                autocomplete?: 'on' | 'off';
                enctype?: string;
                method?: 'get' | 'post';
                name?: string;
                novalidate?: boolean;
                target?: HTMLTarget;
            };
            iframe: Base & {
                src?: string;
                srcdoc?: string;
                width?: number;
                height?: number;
                name?: string;
                sandbox?: string;
            };
            link: Base & {
                crossorigin?: string;
                href?: string;
                media?: string;
                rel?: string;
                sizes?: string;
                type?: string;
            };
            meta: Base & {charset?: string; content?: string; 'http-equiv'?: string; name?: string};

            area: Base & {
                alt?: string;
                coords?: string;
                download?: string;
                href?: string;
                media?: string;
                rel?: string;
                shape?: string;
                target?: HTMLTarget;
                type?: string;
            };
            embed: Base & {src?: string; width?: number; height?: number; type?: string};

            object: Base & {
                data?: string;
                width?: number;
                height?: number;
                name?: string;
                type?: string;
                usemap?: string;
            };

            // svg
            animate: any;
            animateMotion: any;
            animateTransform: any;
            circle: any;
            clipPath: any;
            'color-profile': any;
            defs: any;
            desc: any;
            discard: any;
            ellipse: any;
            feBlend: any;
            feColorMatrix: any;
            feComponentTransfer: any;
            feComposite: any;
            feConvolveMatrix: any;
            feDiffuseLighting: any;
            feDisplacementMap: any;
            feDistantLight: any;
            feDropShadow: any;
            feFlood: any;
            feFuncA: any;
            feFuncB: any;
            feFuncG: any;
            feFuncR: any;
            feGaussianBlur: any;
            feImage: any;
            feMerge: any;
            feMergeNode: any;
            feMorphology: any;
            feOffset: any;
            fePointLight: any;
            feSpecularLighting: any;
            feSpotLight: any;
            feTile: any;
            feTurbulence: any;
            filter: any;
            foreignObject: any;
            g: any;
            hatch: any;
            hatchpath: any;
            image: any;
            line: any;
            linearGradient: any;
            marker: any;
            mask: any;
            mesh: any;
            meshgradient: any;
            meshpatch: any;
            meshrow: any;
            metadata: any;
            mpath: any;
            path: any;
            pattern: any;
            polygon: any;
            polyline: any;
            radialGradient: any;
            rect: any;
            set: any;
            solidcolor: any;
            stop: any;
            svg: any;
            switch: any;
            symbol: any;
            text: any;
            textPath: any;
            title: any;
            tspan: any;
            unknown: any;
            use: any;
            view: any;
        };
    }
}

type HTMLTarget = '_blank' | '_parent' | '_self' | '_top';

type InputType = BaseInput &
    (
        | {type: 'file'; accept?: string; multiple?: boolean}
        | {type: 'image'; src?: string; height?: number; width?: number; alt?: string}
        | {
              type: 'number' | 'range' | 'date' | 'datetime-local' | 'time' | 'month' | 'week';
              min?: number;
              max?: number;
              step?: number;
          }
        | {type: 'checkbox' | 'radio'; checked?: boolean}
        | {type: 'hidden'; value: string}
        | {type: 'button' | 'reset' | 'submit'}
        | {type: 'color'; value?: string}
        | {
              type: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
              autocomplete?: 'on' | 'off';
              placeholder?: string;
              size?: number;
              pattern?: string;
              maxlength?: number;
              spellcheck?: boolean;
              list?: string;
              value: string;
          });
type Base = {
    class?: string;
    title?: string;
    id?: string;
    tabindex?: number;
    style?: Partial<CSSStyleDeclaration>;
    hidden?: boolean;
    children?: VInput;
};

type BaseInput = Base & {
    required?: boolean;
    readonly?: boolean;
    name?: string;
    disabled?: boolean;
    autofocus?: boolean;
};

export {};
