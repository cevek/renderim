declare global {
    namespace JSX {
        interface InputElementArray extends Array<InputElement>{}
        type InputElement = undefined | null | boolean | string | number | Element | InputElementArray;
        type Element = {type: string | ((props: object) => InputElement); props: object; children?: Element | Element[]};
        type CustomChild = {name: string; data: unknown; url?: () => Promise<unknown>};

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
            textarea: BaseInput & {spellcheck?: boolean} & (
                    | {value: string; defaultValue?: never; onInput: () => void; onChange?: never}
                    | {value?: never; defaultValue: string; onInput?: () => void; onChange?: () => void});
            select: BaseInput & {multiple?: boolean; value?: string; size?: number; onChange?: () => void};
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
                onSubmit?: () => void;
                onReset?: () => void;
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
            animate: SVGAttributes;
            animateMotion: SVGAttributes;
            animateTransform: SVGAttributes;
            circle: SVGAttributes;
            clipPath: SVGAttributes;
            'color-profile': SVGAttributes;
            defs: SVGAttributes;
            desc: SVGAttributes;
            discard: SVGAttributes;
            ellipse: SVGAttributes;
            feBlend: SVGAttributes;
            feColorMatrix: SVGAttributes;
            feComponentTransfer: SVGAttributes;
            feComposite: SVGAttributes;
            feConvolveMatrix: SVGAttributes;
            feDiffuseLighting: SVGAttributes;
            feDisplacementMap: SVGAttributes;
            feDistantLight: SVGAttributes;
            feDropShadow: SVGAttributes;
            feFlood: SVGAttributes;
            feFuncA: SVGAttributes;
            feFuncB: SVGAttributes;
            feFuncG: SVGAttributes;
            feFuncR: SVGAttributes;
            feGaussianBlur: SVGAttributes;
            feImage: SVGAttributes;
            feMerge: SVGAttributes;
            feMergeNode: SVGAttributes;
            feMorphology: SVGAttributes;
            feOffset: SVGAttributes;
            fePointLight: SVGAttributes;
            feSpecularLighting: SVGAttributes;
            feSpotLight: SVGAttributes;
            feTile: SVGAttributes;
            feTurbulence: SVGAttributes;
            filter: SVGAttributes;
            foreignObject: SVGAttributes;
            g: SVGAttributes;
            hatch: SVGAttributes;
            hatchpath: SVGAttributes;
            image: SVGAttributes;
            line: SVGAttributes;
            linearGradient: SVGAttributes;
            marker: SVGAttributes;
            mask: SVGAttributes;
            mesh: SVGAttributes;
            meshgradient: SVGAttributes;
            meshpatch: SVGAttributes;
            meshrow: SVGAttributes;
            metadata: SVGAttributes;
            mpath: SVGAttributes;
            path: SVGAttributes;
            pattern: SVGAttributes;
            polygon: SVGAttributes;
            polyline: SVGAttributes;
            radialGradient: SVGAttributes;
            rect: SVGAttributes;
            set: SVGAttributes;
            solidcolor: SVGAttributes;
            stop: SVGAttributes;
            svg: SVGAttributes;
            switch: SVGAttributes;
            symbol: SVGAttributes;
            text: SVGAttributes;
            textPath: SVGAttributes;
            title: SVGAttributes;
            tspan: SVGAttributes;
            unknown: SVGAttributes;
            use: SVGAttributes;
            view: SVGAttributes;
        };
    }
}

type SVGAttributes = any;

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
          } & (
              | {value: number | string; onInput: () => void; onChange?: never; defaultValue: never}
              | {value?: never; defaultValue: number | string; onInput?: () => void; onChange?: () => void})
        | ({type: 'checkbox' | 'radio'; onChange: () => void} & (
              | {defaultChecked?: never; checked: boolean}
              | {defaultChecked?: boolean; checked?: never}
          ))
        | {type: 'hidden'; value: string}
        | {type: 'button' | 'reset' | 'submit'}
        | {type: 'color'; value?: string; onChange?: () => void}
        | {
              type: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
              autocomplete?: 'on' | 'off';
              placeholder?: string;
              size?: number;
              pattern?: string;
              maxlength?: number;
              spellcheck?: boolean;
              list?: string;
          } & (
              | {value: string; defaultValue?: never; onInput: () => void}
              | {value?: never; defaultValue: string; onInput?: () => void; onChange?: () => void}));
type Base = {
    class?: string;
    title?: string;
    id?: string;
    tabindex?: number;
    style?: Partial<CSSStyleDeclaration>;
    hidden?: boolean;
    children?: JSX.InputElement;
    // microdata
    itemtype?: string;
    itemscope?: string;
    itemprop?: string;
    customChild?: JSX.CustomChild;
} & BaseEvents &
    MouseEvents;

type MouseEvents = {
    onClick?: () => void;
    onDblClick?: () => void;
    onContextMenu?: () => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;

    onMouseEnter?: () => void;
    onMouseLeave?: () => void;

    onMouseOver?: () => void;
    onMouseMove?: () => void;
    onMouseOut?: () => void;
    onWheel?: () => void;

    onTouchStart?: () => void;
    onTouchEnd?: () => void;
    onTouchMove?: () => void;
    onTouchCancel?: () => void;

    onSelect?: () => void;
};

type KeyboardEvents = {
    onKeyDown?: () => void;
    onKeyUp?: () => void;
    onKeyPress?: () => void;
};

type BaseEvents = {
    onAnimationStart?: () => void;
    onAnimationEnd?: () => void;
    onAnimationCancel?: () => void;
    onAnimationIteration?: () => void;

    onTransitionStart?: () => void;
    onTransitionCancel?: () => void;
    onTransitionEnd?: () => void;
    onTransitionRun?: () => void;
};

type BaseInput = Base & {
    required?: boolean;
    readonly?: boolean;
    name?: string;
    disabled?: boolean;
    autofocus?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
} & KeyboardEvents;

export {};
