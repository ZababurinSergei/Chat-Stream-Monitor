import { сonfigRouter } from '../index.mjs';
import { multiaddr } from '../../mjs/index.mjs';

export const directory = async (self, props) => {
    const {
        location,
        value
    } = props;

    const ADDRESS = multiaddr(location.pathname).nodeAddress({
        value: !!value ? value : false,
        type: 'mss'
    });

    const result = сonfigRouter.get().find(item => item.value === ADDRESS.value);
    ADDRESS.isRouter = !!result;

    return Object.assign(ADDRESS, result);

};