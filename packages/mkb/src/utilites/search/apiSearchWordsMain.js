import axios from '@src/utilites/API';
import * as links from './links';
import {search} from './index';

/**
 * @description Entity search by word for quick search on the main page
 * @param {string} word - The word by which the entity will be searched
 * @param {string[]} arraySubTree - List of URIs that limit the list of entities to search by word
 * @param {string[]} fields - List of fields that limit the list of entities to search by word. Not use for whis search
 * @returns {object} Object with result of search
*/
export async function apiSearchWordsMain(word, arraySubTree, _fields) {
	try {
		const scale = search.getArrayIdScaleEntity(arraySubTree)
		const body = getBodyForApiSearchWordsMain(word);
		const response = await axios.post(
			links.URL_SEARCH_LINEAR,
			body
		);
		return response;
	} catch (error) {
		console.log(error);
	}
}

/**
* @description Creating a Body for a Request
* @param {string} word - The word by which the entity will be searched
* @returns {{query: string, highlight: boolean, asTree: boolean, fields: string[]}} Body for a Request
*/
function getBodyForApiSearchWordsMain(word) {
  return {
    query: word,
    highlight: true,
		asTree: true,
		fields: [
			"FieldTitle",
			"FieldIndexTerm",
		],
  };
}
