import { fromJS, List } from "immutable"
import { fromJSOrdered, validateParam, paramToValue, paramToIdentifier } from "core/utils"
import win from "core/window"
import {getStore} from '../../'

// selector-in-reducer is suboptimal, but `operationWithMeta` is more of a helper
import {
  specJsonWithResolvedSubtrees,
  parameterValues,
  parameterInclusionSettingFor,
} from "./selectors"

import {
  UPDATE_SPEC,
  UPDATE_URL,
  UPDATE_JSON,
  UPDATE_PARAM,
  UPDATE_EMPTY_PARAM_INCLUSION,
  VALIDATE_PARAMS,
  SET_RESPONSE,
  SET_REQUEST,
  SET_MUTATED_REQUEST,
  UPDATE_RESOLVED,
  UPDATE_RESOLVED_SUBTREE,
  UPDATE_OPERATION_META_VALUE,
  CLEAR_RESPONSE,
  CLEAR_REQUEST,
  CLEAR_VALIDATE_PARAMS,
  SET_SCHEME
} from "./actions"

export default {
  [UPDATE_SPEC]: (state, action) => {
    let api = getStore().api

    api.reducers[UPDATE_SPEC] = (typeof action.payload === "string")
        ? state.set("spec", action.payload)
        : state

    return api.reducers[UPDATE_SPEC]
  },

  [UPDATE_URL]: (state, action) => {
    let api = getStore().api

    api.reducers[UPDATE_URL] = state.set("url", action.payload+"")

    return api.reducers[UPDATE_URL]
  },

  [UPDATE_JSON]: (state, action) => {
    let api = getStore().api

    api.reducers[UPDATE_JSON] = state.set("json", fromJSOrdered(action.payload))

    return api.reducers[UPDATE_JSON]
  },

  [UPDATE_RESOLVED]: (state, action) => {
    let api = getStore().api

    api.reducers[UPDATE_RESOLVED] = state.setIn(["resolved"], fromJSOrdered(action.payload))

    return api.reducers[UPDATE_RESOLVED]
  },

  [UPDATE_RESOLVED_SUBTREE]: (state, action) => {
    let api = getStore().api
    const { value, path } = action.payload

    api.reducers[UPDATE_RESOLVED_SUBTREE] = state.setIn(["resolvedSubtrees", ...path], fromJSOrdered(value))

    return api.reducers[UPDATE_RESOLVED_SUBTREE]
  },

  [UPDATE_PARAM]: ( state, {payload} ) => {
    let api = getStore().api

    let { path: pathMethod, paramName, paramIn, param, value, isXml } = payload
    let paramKey = param ? paramToIdentifier(param) : `${paramIn}.${paramName}`

    const valueKey = isXml ? "value_xml" : "value"

    api.reducers[UPDATE_PARAM] = state.setIn(
        ["meta", "paths", ...pathMethod, "parameters", paramKey, valueKey],
        value
    )

    return api.reducers[UPDATE_PARAM]
  },

  [UPDATE_EMPTY_PARAM_INCLUSION]: ( state, {payload} ) => {
    let api = getStore().api
    let { pathMethod, paramName, paramIn, includeEmptyValue } = payload

    if(!paramName || !paramIn) {
      console.warn("Warning: UPDATE_EMPTY_PARAM_INCLUSION could not generate a paramKey.")
      return state
    }

    const paramKey = `${paramIn}.${paramName}`

    api.reducers[UPDATE_EMPTY_PARAM_INCLUSION] = state.setIn(
        ["meta", "paths", ...pathMethod, "parameter_inclusions", paramKey],
        includeEmptyValue
    )

    return api.reducers[UPDATE_EMPTY_PARAM_INCLUSION]
  },

  [VALIDATE_PARAMS]: ( state, { payload: { pathMethod, isOAS3 } } ) => {
    let api = getStore().api
    const errorsData = {}
    const op = specJsonWithResolvedSubtrees(state).getIn(["paths", ...pathMethod])
    const paramValues = parameterValues(state, pathMethod).toJS()
    let data = {}
    const result = state.updateIn(["meta", "paths", ...pathMethod, "parameters"], fromJS({}), paramMeta => {
      return op.get("parameters", List()).reduce((res, param) => {

        const value = paramToValue(param, paramValues)
        const isEmptyValueIncluded = parameterInclusionSettingFor(state, pathMethod, param.get("name"), param.get("in"))
        const errors = validateParam(param, value, {
          bypassRequiredCheck: isEmptyValueIncluded,
          isOAS3,
        })

        if(!errorsData.hasOwnProperty('isErrors')) {
          errorsData.isErrors = false
        }

        data[`${param.get("name")}`] = {
            name: param.get("name"),
            value: value,
            errors: errors
        }

        errorsData.path = pathMethod[0]
        errorsData.method = pathMethod[1]

        if(!errorsData.isErrors) {
          errorsData.isErrors = errors.length > 0

            if(errorsData.isErrors) {
              errorsData.res = {
                "error": true,
                "statusCode": 412,
                "body": {},
                "statusText": "Неверные данные",
                "ok": false,
                "url": `${pathMethod[0]}`,
                "status": 412,
                "text": `<div>ERROR</div>`
              }
            }
        }

        if(!errorsData.hasOwnProperty('res')) {
          errorsData.res = {}
        }

        if(!errorsData.hasOwnProperty('body')) {
          errorsData.res.body = {}
        }

        errorsData.res.body = data

        return res.setIn([paramToIdentifier(param), "errors"], fromJS(errors))
      }, paramMeta)
    })

    api.reducers[VALIDATE_PARAMS] = errorsData
    return result
  },
  [CLEAR_VALIDATE_PARAMS]: ( state, { payload:  { pathMethod } } ) => {
    let api = getStore().api

    api.reducers[CLEAR_VALIDATE_PARAMS] = {
      path: pathMethod[0],
      method: pathMethod[1]
    }

    return state.updateIn( [ "meta", "paths", ...pathMethod, "parameters" ], fromJS([]), parameters => {
      return parameters.map(param => param.set("errors", fromJS([])))
    })
  },
  [SET_RESPONSE]: (state, { payload: { res, path, method } } ) =>{
    let api = getStore().api

    let result = {}

    if ( res.error ) {
      result = Object.assign({
        error: true,
        name: res.err.name,
        message: res.err.message,
        statusCode: res.err.statusCode
      }, res.err.response)

    } else {
      result = res
    }

    // Ensure headers
    result.headers = result.headers || {}

    let newState = state.setIn( [ "responses", path, method ], fromJSOrdered(result) )

    // ImmutableJS messes up Blob. Needs to reset its value.
    if (win.Blob && res.data instanceof win.Blob) {
      newState = newState.setIn( [ "responses", path, method, "text" ], res.data)
    }

    api.reducers[SET_RESPONSE] = {
      path: path,
      method: method,
      res: result
    }

    return newState
  },

  [SET_REQUEST]: (state, { payload: { req, path, method } } ) =>{
    let api = getStore().api

    api.reducers[SET_REQUEST] = state.setIn( [ "requests", path, method ], fromJSOrdered(req))

    return api.reducers[SET_REQUEST]
  },

  [SET_MUTATED_REQUEST]: (state, { payload: { req, path, method } } ) =>{
    let api = getStore().api

    api.reducers[SET_MUTATED_REQUEST] = state.setIn( [ "mutatedRequests", path, method ], fromJSOrdered(req))

    return api.reducers[SET_MUTATED_REQUEST]
  },

  [UPDATE_OPERATION_META_VALUE]: (state, { payload: { path, value, key } }) => {
    let api = getStore().api
    // path is a pathMethod tuple... can't change the name now.
    let operationPath = ["paths", ...path]
    let metaPath = ["meta", "paths", ...path]

    if(
      !state.getIn(["json", ...operationPath])
      && !state.getIn(["resolved", ...operationPath])
      && !state.getIn(["resolvedSubtrees", ...operationPath])
    ) {

      api.reducers[UPDATE_OPERATION_META_VALUE] = state
      // do nothing if the operation does not exist
      return api.reducers[UPDATE_OPERATION_META_VALUE]
    }

    api.reducers[UPDATE_OPERATION_META_VALUE] = state.setIn([...metaPath, key], fromJS(value))
    return api.reducers[UPDATE_OPERATION_META_VALUE]
  },

  [CLEAR_RESPONSE]: (state, { payload: { path, method } } ) =>{
    let api = getStore().api

    api.reducers[CLEAR_RESPONSE] = state.deleteIn( [ "responses", path, method ])

    return api.reducers[CLEAR_RESPONSE]
  },

  [CLEAR_REQUEST]: (state, { payload: { path, method } } ) =>{
    let api = getStore().api
    api.reducers[CLEAR_REQUEST] = state.deleteIn( [ "requests", path, method ])
    return api.reducers[CLEAR_REQUEST]
  },

  [SET_SCHEME]: (state, { payload: { scheme, path, method } } ) =>{
    let api = getStore().api
    if ( path && method ) {
      api.reducers[SET_SCHEME] = state.setIn( [ "scheme", path, method ], scheme)
      return api.reducers[SET_SCHEME]
    }

    if (!path && !method) {
      api.reducers[SET_SCHEME] = state.setIn( [ "scheme", "_defaultScheme" ], scheme)
      return api.reducers[SET_SCHEME]
    }
  }
}
