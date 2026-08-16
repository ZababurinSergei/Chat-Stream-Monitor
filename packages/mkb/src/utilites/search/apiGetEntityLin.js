import axios from '@src/utilites/API';
import * as links from './links'

/**
 * @description Getting an entity from the linearezation table
 * @param {string} uri - '/v1/icd/release/11/2022-02/mms/{956664712}'
 * @return {Promise<{config: object, data: object, headers: object, request: object, status: number, statusText: string}>} According to the URI, the essence is obtained.
*/
export async function apiGetEntityLin(uri) {
	return await axios.get(uri, links.optionsGetEntity);
};
