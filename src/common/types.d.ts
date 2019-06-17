type DeepPartial<T> = {[P in keyof T]?: DeepPartial<T[P]>};

type IntersectionObserverElementCallbackParams = {
    intersectionRatio: number;
    boundingClientRect: BoundingClientRect;
    intersectionRect: BoundingClientRect;
    rootBounds: BoundingClientRect;
};
type IntersectionObserverElementProps<T extends DeepPartial<IntersectionObserverElementCallbackParams>> = {
    onVisible: (params: T) => void;
    onInvisible?: () => void;
    onVisibleParams?: T;
};
