// export const URL_SEARCH_FOUND = '/v1/icd/entity/search?q=';
// export const URL_SEARCH_LINEAR = '/v1/icd/release/11/2022-02/mms/search?q=';
import { getApi } from '../API'
const API_DATA = getApi()

export const URL_SEARCH_COMPARISON = `/v1/code/version`;
const URL_SEARCH_FOUND_tmp = `/v1/icd/entity/search`;
const URL_SEARCH_LINEAR_tmp = `/v1/icd/release/11/${API_DATA.Release}/mms/search`;
// http://127.0.0.1:3333/v1/icd/entity/1024145243
const URL_PREF_BASE_tmp = 'http://id.who.int';
const URL_PREF_FOUND_tmp = '/v1/icd/entity/';
const URL_POSTF_FOUND_tmp = `?releaseId=${API_DATA.Release}`;

const URL_PREF_LINEAR_tmp = `/v1/icd/release/11/${API_DATA.Release}/mms/`;

const URL_CODE_FOUND_tmp = `/v1/icd/release/11/${API_DATA.Release}/mms/codeinfo`;

const URL_LOCALHOST_tmp = 'http://localhost:3333';
const URL_LOCALHOST_STANDART_tmp = `${window.location.origin}`;
const URL_LOCALHOST_STANDART_V1_tmp = `${window.location.origin}/v1`;

const optionsGetEntity_tmp = {
	mode: 'no-cors',
	headers: {
		'Accept-Language': API_DATA.Lang,
	}
};

const URL_SEARCH_LINEAR_CODE_tmp = `/v1/icd/release/11/${API_DATA.Release}/mms/bycode/`;

const URL_SEARCH_LINEAR_CODE_POSTCOORD_tmp = `/v1/icd/release/11/${API_DATA.Release}/mms/bycode-st`;

////////////////////////////////

export const URL_SEARCH_FOUND = URL_SEARCH_FOUND_tmp;
export const URL_SEARCH_LINEAR = URL_SEARCH_LINEAR_tmp;
// http://127.0.0.1:3333/v1/icd/entity/1024145243
export const URL_PREF_BASE = URL_PREF_BASE_tmp;
export const URL_PREF_FOUND = URL_PREF_FOUND_tmp;
export const URL_POSTF_FOUND = URL_POSTF_FOUND_tmp;

export const URL_PREF_LINEAR = URL_PREF_LINEAR_tmp;

export const URL_CODE_FOUND = URL_CODE_FOUND_tmp;

export const URL_LOCALHOST = URL_LOCALHOST_tmp;
export const URL_LOCALHOST_STANDART = URL_LOCALHOST_STANDART_tmp;
export const URL_LOCALHOST_STANDART_V1 = URL_LOCALHOST_STANDART_V1_tmp;

export const optionsGetEntity = optionsGetEntity_tmp

// export const optionsGetEntity = {
// 	mode: 'no-cors',
// 	headers: {
// 		'Accept-Language': 'ru',
// 		'Accept': 'application/json',
// 		'API-Version': 'v2'
// 	}
// };

// export const headersForApiSearchWords = headersForApiSearchWords_tmp

export const URL_SEARCH_LINEAR_CODE = URL_SEARCH_LINEAR_CODE_tmp;

// export const headersForApiSearchCode = headersForApiSearchCode_tmp

export const URL_SEARCH_LINEAR_CODE_POSTCOORD = URL_SEARCH_LINEAR_CODE_POSTCOORD_tmp;
