import R from 'renderim';
import './lazy.scss';
export default function MyLazy(props: {name: string}) {
    return <div class="lazy">{props.name}</div>;
}
