declare const google: any;
export default function(
    dom: HTMLElement,
    props: {width: string | number; height: string | number; center: {lat: number; lng: number}; zoom: number},
) {
    const map = new google.maps.Map(dom, props);
    dom.style.width = String(props.width);
    dom.style.height = String(props.height);
    return {
        update(newProps: typeof props) {
            map.setOptions(newProps);
        },
        destroy() {},
    };
}
