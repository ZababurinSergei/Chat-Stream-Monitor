/** @module api */
import isEmpty from '../isEmpty'
import axios from '@src/utilites/API';
import store from '../../store'
import { flattenTree } from "../../components/react-accessible-treeview/src";
import { getApi } from '../API'
import { axisTranslate } from './axisTranslate'
import { system } from '../../config'
import { fetchList } from "../../modules/Main/api/tableOfContent";

export const listData = (data) => {
    return {
        "uris": typeof data === 'string' ? [data] : data
    }
}

/**
 * @typedef Page
 * @property {bool} valid True if the token is valid.
 * @property {string} id The user id bound to the token.
 */
const local = {
    protocol: window.location.protocol,
    host: window.location.host,
    hostname: window.location.hostname
}
let API_PARAMS = {}
export const href = {
    link:(path) => {
        API_PARAMS = getApi()
        let result = path.replace(`${window.location.origin}/v1/icd/release/11/${API_PARAMS.Release}/mms/`, 'page/')
        return result
    },
    decoder:(path, type) => {
        API_PARAMS = getApi()
        let result = path.replace(`/v1/icd/release/11/${API_PARAMS.Release}/mms/`, `${ type ? `${process.env.PUBLIC_URL}/${type}`: `${process.env.PUBLIC_URL}/page`}/`)
        return result
    },
    transform:(path, type) => {
        API_PARAMS = getApi()
        let result = path.replace(`/icd/release/11/${API_PARAMS.Release}/mms/`, `${ type ? `${process.env.PUBLIC_URL}/${type}`: `${process.env.PUBLIC_URL}/page`}/`)
        return result
    },
    entityToCurrent:(href, type) => {
        API_PARAMS = getApi()
        let result = {}
        if(Array.isArray(href)) {
            result = href.map(item => {
                const current = new URL(item)
                current.hostname = window.location.hostname
                current.pathname = current.pathname.replace('/icd/entity/', '/v1/icd/entity/')
                return current
            })
        }

        return result
    },
    encode:(path, type) => {
        API_PARAMS = getApi()
        let result = path.includes(`/v1/${type ?type:'page'}/`) ? path.replace(`/v1/${type? type: 'page'}/`, `/v1/icd/release/11/${API_PARAMS.Release}/mms/`) : path.replace(`/${type? type: 'page'}/`, `/v1/icd/release/11/${API_PARAMS.Release}/mms/`)
        return result
    },
    entity:(path) => {
        API_PARAMS = getApi()
        let result = path.replace('/page/', `/v1/icd/entity/`)
        return result
    },
    icdToPath:(path, type) => {
        API_PARAMS = getApi()
        let result = path.replace(`/icd/release/11/${API_PARAMS.Release}/mms/`, `/${type}/`)
        return result
    },
    linearization: (path) => {
        API_PARAMS = getApi()
        let result = path.replace('/page/', `/v1/icd/release/11/${API_PARAMS.Release}/mms/`)
        return result
    },
    icd2self: (url, test) => {
        API_PARAMS = getApi()
        if(url.startsWith('/v1')){
            return url
        }

        return url.replace(`/icd/release/11/${API_PARAMS.Release}/mms/`, `/v1/icd/release/11/${API_PARAMS.Release}/mms/`)
    }
}

const transformChapters = (data) => {
    const result = {
        children: [{
            children: [],
            link: window.location.origin,
            name:"МКБ-11 для ведения статистики смертности и заболеваемости"
        }],
        link:"",
        name:""
    }

    for(let item of data) {
        result.children[0].children.push({
            name: `${item.code ?item.code :''} ${item.title}`,
            link: item.id,
            id: item.id,
            exclusion: item.exclusion,
            codeRange: item.codeRange,
            codingNote: item.codingNote,
            classKind: item.classKind,
            title: item.title,
            code: item.code,
            child: item.child,
            children: item.child ? [{name:''}] : []
        })
    }

    return result
}

const transformChildren = (data) => {
    const result = []
    for(let item of data) {
        result.push({
            name: `${item.code ? item.code : ''} ${item.title}`,
            classKind: item.classKind,
            ancestor: item.ancestor,
            code: item.code,
            chapter: item.chapter,
            postcoordinationScale: item.postcoordinationScale,
            codeRange: item.codeRange,
            link: item.id,
            id: item.id,
            title: item.title,
            isChild: item.isChild,
            child: item.isChild ? [] : item.child,
            isFoundationChildElsewhere: item.isFoundationChildElsewhere
        })
    }

    return result
}

const transformChildrenWithChildren = (data) => {
    const result = []

    for(let item of data) {
        let itemResult = {
            name: `${item.code ? item.code : ''} ${item.title}`,
            link: item.id,
            id: item.id,
            ancestor: item.ancestor,
            code: item.code,
            codeRange: item.codeRange,
            exclusion: item.exclusion,
            codingNote: item.codingNote,
            postcoordinationScale: item.postcoordinationScale,
            chapter: item.chapter,
            title: item.title,
            classKind: item.classKind,
            child: item.child,
            isChild: item.isChild,
            children: item.child || item.isChild ? [{name:''}] : [],
            isFoundationChildElsewhere: item.isFoundationChildElsewhere
        }

        result.push(itemResult)
    }

    return result
}

const transformUrl = (url, type='href') => {
    let result = {}

    if(!url) {
        return
    }

    if(Array.isArray(url)) {
        API_PARAMS = getApi()
        url = url.filter(item => item)

        return url.map(item => {
            let data = typeof item === 'string' ? item : item['@id'];
            let path = new URL(data)
            if(data.indexOf(`/v1/icd/release/`) === -1) {
                path.pathname = `/v1${path.pathname.replace('2020-09', `${API_PARAMS.Release}`)}`
            }
            return Object.assign(path, local)[`${type}`];
        })
    }

    if(url.indexOf(`/v1/icd/release/`) === -1) {
        result = new URL(url)
        // result.pathname = result.pathname.replace()
        result.pathname = `/v1${result.pathname.replace('2020-09', `${API_PARAMS.Release}`)}`
        result = Object.assign(result, local)
        return result[`${type}`]
    }

    return url
}

const transformFoundationToLin = (url) => {
    let result = {}

    if(!url) {
        return
    }
    const API_PARAMS = getApi()
    if(Array.isArray(url)) {
        return url.map(item => {
            let path = new URL(item)
            path.pathname = path.pathname.replace('/icd/entity/',`/v1/icd/release/11/${API_PARAMS.Release}/mms/`)
            return Object.assign(path, local).href
        })
    }

    const path = new URL(url)
    path.pathname = path.pathname.replace('/icd/entity/',`/v1/icd/release/11/${API_PARAMS.Release}/mms/`)
    return Object.assign(result, local).href
}

const transformToEntity = (url) => {
    let result = {}
    if(!url) {
        return
    }
    const API_PARAMS = getApi()
    url = url.replace('2020-09', `${API_PARAMS.Release}`)
    result = new URL(url.replace(`/release/11/${API_PARAMS.Release}/mms/`, '/entity/'))
    result = Object.assign(result, local)
    return result.href
}

const transformFoundation = (url) => {
    if(!url) return
    const API_PARAMS = getApi()

    if(Array.isArray(url)) {
        return url.map(item => {
            const path = new URL(item)
            path.pathname = `v1${path.pathname}`
            return Object.assign(path, local).href
        })
    }
    const path = new URL(url)
    path.pathname = `v1${path.pathname}`
    return Object.assign(new URL(url), local).href
}

const childRequest = async (endpoints) => {
    try {
        if(Array.isArray(endpoints)) {
            let data = await Promise.allSettled(endpoints.map((endpoint) => {
                return axios.get(typeof endpoint === 'object' ? endpoint.pathname : new URL(endpoint).pathname)
            }));
            return data.map(item => item.value.data)
        } else {
            return (await axios.get(href.encode(new URL(endpoints).pathname))).data;
        }
    } catch (e) {
        console.error(e)
    }
}

const verify = (href) => {
    const API_PARAMS = getApi()
    if(href.indexOf('/icd/entity/') !== -1) {
        return href.replace('/icd/entity/',`/icd/release/11/${API_PARAMS.Release}/mms/`)
    }

    return href
}

const getConcept = async (href) => {
    return axios.get((new URL(verify(href))).pathname)
}

export const api = {
    transform: {
        childrenWithChildren: transformChildrenWithChildren,
        children: transformChildren,
        chapters: transformChapters,
        url: {
            linearization: transformUrl,
            foundation: {
                self: transformFoundation,
                lin2foundation: transformToEntity,
                foundation2Lin: transformFoundationToLin
            }
        }
    },
    get: {
        Concept: getConcept,
        ChildrenConcepts: childRequest
    }
}

/**
 * @param children {Array}
 * @returns {Promise}
 */
const getChildren = async (children) => {
    const data = await api.get.ChildrenConcepts(children)
    const child = data.map(item => {
        return {
            id: api.transform.url.linearization(item[`@id`]).pathname,
            classKind: item.classKind,
            parent: item.parent.map(item => api.transform.url.linearization(item).pathname ),
            code: item.code,
            title: item.title['@value'],
            child: item.child ? item.child.map(item => api.transform.url.linearization(item).pathname ) : undefined
        }
    })
    return api.transform.children((child))
}

/**
 *
 * @type {{chapter: (function(*): Promise<unknown>), code: {get: (function(*): Promise<string>), range: (function(*, *=, *): Promise<unknown>)}, block: (function(*): Promise<{code: *, id: *, title: *}>)}}
 */
const exclusion = {
    code: {
        range: (data, length = 1, type) => {
            return new Promise(async resolve => {
                let code = ''
                let child = (type === 'first')
                    ? await api.get.ChildrenConcepts(api.transform.url.linearization(data[length]))
                    : await api.get.ChildrenConcepts(api.transform.url.linearization(data[data.length - length]))
                switch (child.classKind) {
                    case 'block':
                        if(child.codeRange) {
                            if(child.codeRange.indexOf('-') !== -1) {
                                code = child.codeRange.split('-')[1]
                                resolve(code)
                            }
                        }
                        break
                    case 'category':
                        resolve(child.code)
                        break
                    case 'window':
                        resolve(await exclusion.code.range(data, length + 1))
                        break
                    default:
                        resolve(code)
                        break
                }
            })
        },
        get: async (link) => {
            let code = []
            const data = await api.get.ChildrenConcepts(api.transform.url.linearization(link))
            code.push(await exclusion.code.range(data.child, 0,'first'))
            code.push(await exclusion.code.range(data.child, 1,'last'))
            return code.join('-')
        }
    },
    block: async (item) => {
        if(!item.codeRange) {
            let codeRange = [item.child[0], item.child[item.child.length -1]]
            codeRange = await fetchList(listData(codeRange))
            codeRange = `${codeRange[0].code}-${codeRange[1].code}`
            item.codeRange = codeRange
        }
        return {
            id: item['@id'],
            title: item.title['@value'],
            code: item.codeRange
        }
    },
    category: async (item) => {
        return {
            id: item['@id'],
            title: item.title['@value'],
            code: item.code
        }
    },
    chapter: (item) => {
        return new Promise(async resolve => {
            const chapters = store.getState().icd.toc.chapter
            if(!isEmpty(chapters)) {
                const chapter = chapters.find(chapter => {
                    return (chapter.code == item.code)
                        ? chapter
                        : false
                })

                const code = await exclusion.code.get(chapter.link)
                resolve({
                    id: item['@id'],
                    title: item.title['@value'],
                    code: code
                })
            } else {
                resolve({
                    id: item['@id'],
                    title: item.title['@value'],
                    code: item.code
                })
            }
        })
    }
}

const ucFirst = (str) => {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

export const getAxisName = (axisName) => {
    if(axisName) {
        API_PARAMS = getApi()
        let tmp = axisName.split('/')
        const name = (tmp[tmp.length -1].split(/(?=[A-Z])/).map((item, index) => index === 0 ? ucFirst(item): item.toLowerCase())).join(' ')
        const result = axisTranslate(name.trim(), API_PARAMS.Lang)
        return result
    } else {
        return 'Ошибка'
    }
}

const childrenTransform = (child, axisName) => {
    try {
        let result = []
        for(let i = 0; i < child.length; ++i) {
            if(child[0]['@id']) {
                result.push({
                    id: child[i][`@id`],
                    ancestor: api.transform.url.linearization(child[i].ancestor),
                    parent: child[i].parent,
                    child: !isEmpty(child[i].child) ? childrenTransform(child[i].child) : [],
                    classKind: child[i].classKind,
                    isFoundationChildElsewhere: child[i].isFoundationChildElsewhere,
                    title: child[i].title['@value'],
                    code: child[i].code,
                    codeRange: child[i].codeRange,
                    postcoordinationScale: child[i].postcoordinationScale
                })
            } else {
                result.push(child[i])
            }
        }

        return result
    } catch (e) {
        console.error('(( ERROR ))', e)
        return []
    }
}

export const transformScaleEntity = async (scaleEntity, axisName) => {
    let layer = []

    for(let j = 0; j < scaleEntity.length; ++j) {
        if(isEmpty(layer[j])) {
            layer[j] = []
            layer[j].classKind = scaleEntity[j].classKind
            layer[j].child = isEmpty(scaleEntity[j].child) ? [] : childrenTransform(scaleEntity[j].child, axisName)
            layer[j].ancestor = api.transform.url.linearization(scaleEntity[j].ancestor)
            layer[j].parent = scaleEntity[j].parent
            layer[j].descendant = scaleEntity[j].descendant
            layer[j].code = scaleEntity[j].code
            layer[j].codeRange = scaleEntity[j].codeRange
            layer[j].title = scaleEntity[j].title['@value']
            layer[j].id = scaleEntity[j]['@id']
            layer[j].postcoordinationScale = scaleEntity[j].postcoordinationScale
        }
    }

    for(let i = 0; i < scaleEntity.length; ++i) {
        if(layer[i].postcoordinationScale) {
            layer[i].postcoordinationScale = layer[i].postcoordinationScale.map(item => {
                item.axisName = getAxisName(item.axisName)
                return item
            })
        }

        scaleEntity[i].ancestor = layer[i].ancestor
        scaleEntity[i].child = layer[i].child
        scaleEntity[i].postcoordinationScale = layer[i].postcoordinationScale
    }


    return layer
}

const transformScaleEntityId = (scaleEntity) => {
    let result = []
    if(!isEmpty(scaleEntity)) {
        result = scaleEntity.map(item => {
            if (typeof item !== 'string') {
                item.id =  transformUrl(item.id)
            }
            return item
        })
    }

    return result
}

let request = { }
export const getParentChapter = async (link, type) => {
    if(isEmpty(request[`${link}`])) {
        request[`${link}`] = await api.get.ChildrenConcepts(link);
        return  request[`${link}`]
    } else {
        return request[`${link}`]
    }
}

const getChildrenForToc = async (child, axisName) => {
    let result = []
    if(isEmpty(child)) {
        return []
    } else {
        for(let item of child) {
            const chapter = item.classKind === "chapter" ? item.code : await getParentChapter(api.transform.url.linearization(item.ancestor[item.ancestor.length - 1]), '4444')

            result.push({
                name: `${item.code ? item.code : ''} ${item.title}`,
                code: item.code,
                chapter: chapter.code,
                codeRange: item.codeRange,
                ancestor: api.transform.url.linearization(item.ancestor),
                title: item.title,
                link: item.id,
                isFoundationChildElsewhere: !!item.isFoundationChildElsewhere,
                postcoordinationScale: item.postcoordinationScale,
                classKind: item.classKind,
                child: item.child,
                children: isEmpty(item.child) ? [] : [{name:''}]
            })
        }

        return  result
    }
}

/**
 * @param axis
 * @description преобразование объекта для отображения на странице в объект для table of content
 * @returns {Promise}
 */
const transformAxisToToc = async (axis, axisName) => {
    const result = {
        name: '',
        link: '',
        children: []
    }

    if(axis.isVisible) {
        for(let item of axis.scaleEntity) {
            const ancestor = api.transform.url.linearization(item.ancestor[item.ancestor.length - 1])

            const chapter = await getParentChapter(ancestor)
            const data = {
                name: `${item.code ? item.code : ''} ${item.title}`,
                code: item.code,
                chapter: chapter.code,
                codeRange: item.codeRange,
                isFoundationChildElsewhere: !!item.isFoundationChildElsewhere,
                ancestor: api.transform.url.linearization(item.ancestor),
                title: item.title,
                link: item.id,
                postcoordinationScale: item.postcoordinationScale,
                classKind: item.classKind,
                child: await transformScaleEntityId(item.child, axisName),
                children: await getChildrenForToc(item.child, axisName)
            }

            result.children.push(data)
        }

        const tocResult = flattenTree(result, axisName)

        return tocResult
    } else {
        for(let item of axis.scaleEntity) {
            let ancestor = undefined
            let chapter = undefined

            if(item.classKind === "chapter") {
                chapter = item.code
            } else {
                ancestor = api.transform.url.linearization(item.ancestor[item.ancestor.length - 1])
                chapter = await getParentChapter(ancestor)
            }

            const data = {
                name: `${item.code ? item.code : ''} ${item.title}`,
                code: item.code,
                chapter: chapter.code,
                codeRange: item.codeRange,
                isFoundationChildElsewhere: !!item.isFoundationChildElsewhere,
                ancestor: api.transform.url.linearization(item.ancestor),
                title: item.title,
                link: item.id,
                postcoordinationScale: item.postcoordinationScale,
                classKind: item.classKind,
                child: await transformScaleEntityId(item.child, axisName),
                children: isEmpty(item.child) ? [] : [{name:''}]
            }

            result.children.push(data)
        }

        const tocResult = flattenTree(result, axisName)

        return tocResult
    }
}

/**
 * @param postcoordinationScale
 * @desc преобразуется объект в дерево для вывода на экран
 * @returns {Promise}
 */
export const transformPostcoordinationScale = async (postcoordinationScale) => {
    const layers = []
    layers.code = postcoordinationScale.code
    layers.title = postcoordinationScale.title['@value']
    layers.postcoordinationScale = []

    for(let type of postcoordinationScale.postcoordinationScale) {
        layers.postcoordinationScale.push({
            axisName: type.axisName,
            allowMultipleValues: type.allowMultipleValues,
            requiredPostcoordination: !!type.requiredPostcoordination,
            scaleEntity: await transformScaleEntity(type.scaleEntity, type.axisName)
        })
    }

    for(let axis of layers.postcoordinationScale) {
        axis.isVisible = true
        let limit = 0
        limit = axis.scaleEntity.length
        for(let item of axis.scaleEntity) {
            limit = limit + item.child.length
            if(!isEmpty(item.child)) {
                for(let data of item.child) {
                    if(data.child) {
                        limit = limit + data.child.length
                    }
                }
            }

            if((item.classKind === 'block' && !item.code && !item.codeRange) || limit > 12) {
                axis.isVisible = false
            }
        }

        axis.toc = await transformAxisToToc(axis, axis.axisName)
    }
    return layers
}

export const getInclusion = async (page) => page.inclusion.map(item => !isEmpty(item.label) ? {
    title: item.label['@value'],
    language: item.label['@language']
} : false)

/**
 * @param page
 * @returns {Promise<{}>}
 */
export const getExclusion = async (endpoints) => {
    let dataExclusion = []

    for(let item of endpoints) {
        switch (item.classKind) {
            case 'chapter':
                dataExclusion.push(await exclusion.chapter(item))
                break
            case 'block':
                dataExclusion.push(await exclusion.block(item))
                break
            case 'category':
                dataExclusion.push(await exclusion.category(item))
                break
            default:
                break
        }
    }

    return dataExclusion
}

export const getFoundationChildElsewhere = async (childs) => {
    let foundationChildElsewhere = []
    let data = {}

    if(system.api) {
        data = childs
    } else {
        data = await api.get.ChildrenConcepts(api.transform.url.linearization(childs))
    }

    for(let item of data) {
        foundationChildElsewhere.push({
            id: item['@id'],
            title: item.title['@value'],
            code: item.codeRange ? item.codeRange : item.code
        })
    }

    return foundationChildElsewhere
}

const getScaleEntity = async (item, length = 0) => {
    let layer = {}

    layer = {
        allowMultipleValues: item.allowMultipleValues,
        axisName: getAxisName(item.axisName),
        requiredPostcoordination: item.requiredPostcoordination,
        scaleEntity:  typeof item.scaleEntity[0] === 'string' ? await fetchList(listData(item.scaleEntity)) : item.scaleEntity,
        length: length
    }

    if(length < 12) {
        for(let i = 0; i < layer.scaleEntity.length; ++i) {
            if(layer.scaleEntity[i].child) {
                layer.scaleEntity[i].child = system.api? await fetchList(listData(layer.scaleEntity[i].child)):await api.get.ChildrenConcepts(api.transform.url.linearization(layer.scaleEntity[i].child))
                layer.scaleEntity[i].child = typeof layer.scaleEntity[i].child[0] === 'string'
                    ? await fetchList(listData(layer.scaleEntity[i].child))
                    : layer.scaleEntity[i].child
            }
        }
    }

    return layer
}

/**
 *
 * @param page
 * @returns {Promise<{}>}
 */
export const getPostcoordinationScale = async (postcoordination, result = []) => {
    for(let i = 0; i < postcoordination.postcoordinationScale.length; ++i) {
        postcoordination.postcoordinationScale[i] = await getScaleEntity(postcoordination.postcoordinationScale[i], postcoordination.postcoordinationScale[i].scaleEntity.length)
    }
    return postcoordination
}

export const getAncestor = async (ancestor) => {
    return ancestor.map(item => {
        switch (item.classKind) {
            case 'chapter':
                return {
                    title: `${item.code} ${item.title['@value']}`,
                    id: href.link(api.transform.url.linearization(item['@id']))
                }
            case 'window':
                return {
                    title: `${item.title['@value']}`,
                    id: href.link(api.transform.url.linearization(item['@id']))
                }
            case 'block':
                return {
                    title: `${item.title['@value']}`,
                    id: href.link(api.transform.url.linearization(item['@id']))
                }
            case 'category':
                return {
                    title: `${item.code} ${item.title['@value']}`,
                    id: href.link(api.transform.url.linearization(item['@id']))
                }
            default:
                console.log('необрабатываемый тип', item)
                break
        }

        return item
    }).reverse();
}

const fetchChildren = async (endpoint) => {
    if(typeof endpoint !== 'string') {
        return await  childRequest(endpoint)
    } else {
        const {
            data: response
        } = await axios.get(new URL(endpoint).pathname)
        return  response
    }
}

export const foundationChildElsewhere = async (destination, type) => {
    let destinationFoundationChildElsewhere = []
    if (!isEmpty(destination.foundationChildElsewhere)) {
        destination.foundationChildElsewhere = destination.foundationChildElsewhere.filter(item => {
            let foundationChildElsewhereID = item.foundationReference.substring(item.foundationReference.lastIndexOf('/') + 1)
            let linearizationReferenceID = item.linearizationReference.substring(item.linearizationReference.lastIndexOf('/') + 1)
            return foundationChildElsewhereID === linearizationReferenceID
        })

        if (system.api) {
            for (let item of destination.foundationChildElsewhere) {
                destinationFoundationChildElsewhere.push(item.linearizationReference)
            }
        } else {
            for (let item of destination.foundationChildElsewhere) {
                const children = await fetchChildren(api.transform.url.linearization(item.linearizationReference))
                children.isFoundationChildElsewhere = true
                destinationFoundationChildElsewhere.push(children)
            }

        }

        if (system.api) {
            if (!isEmpty(destinationFoundationChildElsewhere)) {
                destinationFoundationChildElsewhere = await fetchList(listData(destinationFoundationChildElsewhere))
                for (let item of destinationFoundationChildElsewhere) {
                    item.isFoundationChildElsewhere = true
                }
            }
        }

        for (let childElsewhere of destinationFoundationChildElsewhere) {
            if (childElsewhere.foundationChildElsewhere) {
                for (let itemChildElsewhere of childElsewhere.foundationChildElsewhere) {
                    let linearizationReference = itemChildElsewhere.linearizationReference.split('/')
                    let foundationReference = itemChildElsewhere.foundationReference.split('/')
                    linearizationReference = linearizationReference[linearizationReference.length - 1]
                    foundationReference = foundationReference[foundationReference.length - 1]

                    if (linearizationReference === foundationReference) {
                        childElsewhere.isChild = true
                        childElsewhere.isFoundationChildElsewhere = true
                        break
                    }
                }
            }
        }

        return isEmpty(destinationFoundationChildElsewhere) ? undefined : destinationFoundationChildElsewhere
    }

    return  undefined
}

export const childForPostcoordination = async (postcoordinationScale) => {
    let data = postcoordinationScale
    for(let i = 0; i < data.postcoordinationScale.length; ++i) {
        if(data.postcoordinationScale[i].length <= 12) {
            for(let j = 0; j < data.postcoordinationScale[i].scaleEntity.length; ++j) {
                if(!isEmpty(data.postcoordinationScale[i].scaleEntity[j].child)) {
                    for(let k = 0; k < data.postcoordinationScale[i].scaleEntity[j].child.length; ++k) {
                        if(!isEmpty(data.postcoordinationScale[i].scaleEntity[j].child[k].child)) {
                            if(!isEmpty(data.postcoordinationScale[i].scaleEntity[j].child[k].child)) {
                                let result = (system.api)
                                    ? await fetchList(listData(data.postcoordinationScale[i].scaleEntity[j].child[k].child))
                                    : await fetchChildren(api.transform.url.linearization(data.postcoordinationScale[i].scaleEntity[j].child[k].child));
                                data.postcoordinationScale[i].scaleEntity[j].child[k].child = result
                                data.postcoordinationScale[i].length = data.postcoordinationScale[i].length + result ? result.length : 0
                                if(data.postcoordinationScale[i].length > 12) {
                                    return  data
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return data
}

export const getList = (item, data, itemID) => {
    const id = itemID.code ? itemID.code: itemID.codeRange
    const from = itemID.title['@value']

    if(isEmpty(data.array)) {
        data.array = []
    }

    if(isEmpty(data.object)) {
        data.object = {}
    }

    if(isEmpty(data.iterator)) {
        data.iterator = 0
    }

    data.array.push(item)

    data.object[data.iterator] = {
        id: id,
        from: from
    }

    data.iterator++

    return data
}

export const API = {
    transform: {
        url: {
            linearization: transformUrl,
            entity: transformToEntity
        }
    },
    get: {
        children: getChildren
    }
}
