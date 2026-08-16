import axios from '@src/utilites/API';
import * as links from './links';
import {search} from './index';
import {URL_CODE_FOUND} from "./links";

/**
 * @description Getting an entity by code
 * @param {string} code - The code by which the entity will be searched
 * @returns {object[]|[]} Result of search
 */
export async function apiCodeInfo(body) {
	let result = [];
	try {
		const response = await axios.post(`${links.URL_CODE_FOUND}`, body);
		result.push(response);
	} catch(error) {
		console.log(error);
	} finally {
		return result;
	}
}
