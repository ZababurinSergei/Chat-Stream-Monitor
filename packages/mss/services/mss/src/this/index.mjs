export {verification, init, onload, slotRouter} from './init/index.mjs'
export {store} from './store/index.mjs'
export {component, config, sections, taskProperty, taskRelation, eventsName, link} from './config/index.mjs'
export {
    loadHTML,
    pixelToVH,
    pixelToVW,
    size,
    vhToPixel,
    vwToPixel,
    clearnPx,
    activeClass,
    normalizePathName,
    events,
    events_d,
    useAuth,
    getTokenPair,
    getUserInfo,
    getRefreshToken,
    signIn,
    logOut,
    delay,
    loader,
    animationCount,
    randomColor,
    anime,
    task,
    emoji,
    isEmpty,
    Multiaddr,
    multiaddr,
    removeParamFromURL,
    protocols,
    resolvers,
    toBase64,
    fromBase64,
    path,
    search,
    camelToSnakeCase,
    format,
    isEqual,
    compareAsc,
    isWithinInterval,
    Ansis,
    jwtDecode,
} from './mjs/index.mjs'

export { router, сonfigRouter } from './router/index.mjs'

export default {
    description: 'all modules for this'
}