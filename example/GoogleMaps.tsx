import {createElement, loadClientScript, client} from 'renderim';
const Maps = client(() => import('./GoogleMapsClient'));

export function GoogleMaps(props: {apiKey: string} & Parameters<typeof Maps>[0]) {
    loadClientScript(`https://maps.googleapis.com/maps/api/js?key=${props.apiKey}`);
    return <Maps {...props} />;
}
