import axios from "axios"
import isEmpty from "@src/utilites/isEmpty";
// import {getCode} from "../../modules/Main/components/Main/Coder";
import { jwtDecode } from "jwt-decode";
export function analyticsPluginMkb(userConfig) {
  return {
    name: 'mkb-plugin',
    bootstrap: ({ payload, config, instance }) => {
      // Do whatever on `bootstrap` event
    },
    pageStart: ({ payload, config, instance }) => {
      // Fire custom logic before analytics.page() calls
    },
    pageEnd: ({ payload, config, instance }) => {
      const accessToken = localStorage.getItem("accessToken");
      const alreadyUsedMisToken = localStorage.getItem("alreadyUsedMisToken");
      const sid = localStorage.getItem("sid");
    // && !isEmpty(accessToken)
      if(!isEmpty(sid) && !isEmpty(alreadyUsedMisToken)) {
        let request = {
          "actionType": instance.user().traits.action,
          "icd11Code": instance.user().traits.deseaseCode,
          "icd11Name": "",
          "icd10Code": "",
          "icd10Name": "",
          "timestamp": Date.now()
        }

        if(instance.user().traits.action === 'comparison_browse_copy') {
          request = {
            "actionType": instance.user().traits.action,
            "icd11Code": instance.user().traits.icd11Code,
            "icd10Code": instance.user().traits.icd10Code,
            "icd10Name": instance.user().traits.icd10Name,
            "timestamp": Date.now()
          }
        }

        if(instance.user().traits.action === 'comparison_browse') {
          request = {
            "actionType": instance.user().traits.action,
            "icd11Code": instance.user().traits.icd11Code,
            "icd11Name": instance.user().traits.icd11Name,
            "icd10Code": instance.user().traits.icd10Code,
            "icd10Name": instance.user().traits.icd10Name,
            "timestamp": Date.now()
          }
        }

        if(isEmpty(request.actionType)) {
          delete request.actionType
        }

        if(isEmpty(request.icd11Code)) {
          delete request.icd11Code
        }

        if(isEmpty(request.icd11Name)) {
          delete request.icd11Name
        }

        if(isEmpty(request.icd10Code)) {
          delete request.icd10Code
        }

        if(isEmpty(request.icd10Name)) {
          delete request.icd10Name
        }

        if(isEmpty(request.sid)) {
          delete request.sid
        }

        if(isEmpty(request.oid)) {
          delete request.oid
        }

        if(isEmpty(request.timestamp)) {
          delete request.timestamp
        }

        if(!window.location.origin.startsWith('http://localhost')) {
          axios.post(`/v1/stats?sid=${sid}`, request, {
            withCredentials: true,
            headers: {
              "Authorization": `Bearer ${JSON.parse(alreadyUsedMisToken)}`
            }
          }).catch(e => {
            console.log(e)
          })
        } else {
          console.log('🟡 Статистика: ', request)
        }
      } else {

      }
    },
    trackStart: ({ payload, config, instance }) => {
      // Fire custom logic before analytics.track() calls
    },
    trackEnd: ({ payload, config, instance }) => {
      // Fire custom logic after analytics.track() calls
    },
    // ... hook into other events
  }
}
