import axios from '@src/utilites/API';
import * as links from './links';
import {search} from './index';

/**
 * @description Getting an entity by code
 * @param {string} code - The code by which the entity will be searched
 * @returns {object[]|[]} Result of search
 */
export async function apiSearchComparison(code, version) {
	let result = [];
	try {
		const response = await axios.get(`${links.URL_SEARCH_COMPARISON}/${version.trim()}/comparison?code=${code.toUpperCase().trim()}&sid=1sdf2345`);
		result.push(response);
	} catch(error) {
		console.log(error);
	} finally {
		return result;
	}
}
