import axios from '@src/utilites/API';
import * as links from './links';
import {search} from './index';

/**
 * @param {string} word - The word by which the entity will be searched
 * @param {string[]} arraySubTree - List of URIs that limit the list of entities to search by word
 * @param {string[]} fields - List of fields that limit the list of entities to search by word
 * @returns {object} Object with result of search
*/
export async function apiSearchWordsCoord(word, arraySubTree, fields) {
	try {
		const scale = search.getArrayIdScaleEntity(arraySubTree)
		// const scale = arraySubTree.map(scaleEntity => scaleEntity.id)
		const body = getBodyForApiSearchWords(word, scale, fields);
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
* @param {string[]} arraySubTree - List of URIs that limit the list of entities to search by word
* @param {string[]} fields - List of fields that limit the list of entities to search by word
* @returns {{query: string, highlight: boolean, subTree: string[], fields: string[]}} Body for a Request
*/
function getBodyForApiSearchWords(word, arraySubTree, fields) {
  return {
    query: word,
    highlight: false,
    subTree: arraySubTree,
		fields: fields,
  };
}
