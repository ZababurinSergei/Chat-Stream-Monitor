/** @module searchWords */
import * as links from './links';
import { search } from './index';

/**
 * @description Getting an array with entities by the entered word.
 * @param {string} word - The word by which the entity will be searched.
 * @return {Array<{code: string, entity: object, entityId: number, foundationEntityId: number, foundationURI: string, fragments: object[], isLeaf: boolean, isWords: boolean, kind: string, title: string, uri: string}>} An array with entities found by the entered word.
 * - links have been replaced with relevant ones for searching in the database
 * - added properties with entity content from getEntity references
 * - removed duplicate objects by entityId mapObjects
 */
export async function searchWords(value) {
  try {
    if (value.length >= 3) {
      const response = await search.api.apiSearchWords(value);
      const objectsWithoutVX = deleteChapters(response.data);
      const unicObjects = mapObjects(objectsWithoutVX);
      const responseWithNewUri = changeArrayUriForGetLinearization(unicObjects);
      const newResponse = await getEntity(responseWithNewUri);
			const objectsWithChildren = await getChild(newResponse);
      return objectsWithChildren;
    } else {
      return [];
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * @description Replacing the URI contained in the search response to search the database for the foundation component. NOT USE. Do not delete.
 * @param {object[]} data - An array of objects obtained from the apiSearchWords function.
 * @return {object[]} Array of objects with changed URI for each.
 */
function changeUriForGetFoundation(data) {
  return data.map(obj => ({
    ...obj,
    uriFound: `${links.URL_PREF_FOUND}${obj.entityId}`,
  }));
}

/**
 * @description Replacing the URI contained in the search response to search the database for the linearization.
 * @param {Object[]} data - An array of objects obtained from the apiSearchWords function.
 * @return {Object[]} Array of objects with changed URI for each. Replacing the URI from the database with the desired one - uri: 'http://id.who.int/icd/release/11/2022-02/mms/{194483911}', uri: '/v1/icd/release/11/2022-02/mms/{194483911}'.
 */
function changeArrayUriForGetLinearization(data) {
  return data.map(obj => changeUriForGetLinearization(obj));
}

export function changeUriForGetLinearization(obj) {
  if (obj.uri.includes('other')) {
    return {
      ...obj,
      uri: `${links.URL_PREF_LINEAR}${obj.entityId}/other`,
    };
  }
  if (obj.uri.includes('unspecified')) {
    return {
      ...obj,
      uri: `${links.URL_PREF_LINEAR}${obj.entityId}/unspecified`,
    };
  }
  return {
    ...obj,
    uri: `${links.URL_PREF_LINEAR}${obj.entityId}`,
  };
}

function changeUriTermForGetLinearization(obj) {
  if (obj.foundationReference) {
    return {
      ...obj,
      foundationReference: `${links.URL_PREF_LINEAR}${obj.entityId}`,
    };
  }
  return obj;
}

/**
 * @description Replacing the URI contained in the search response to search the database for the linearization component.
 * @param {object[]} data - Array of objects received from search api with changed URI.
 * @return {Promise<object[]>} An array of objects with the addition of a property with an entity key containing a category from the database.
 */
async function getEntity(data) {
  try {
    const resultRequests = await Promise.allSettled(
      data.map(async obj => {
        const response = await search.api.apiGetEntityLin(obj.uri);
        return { ...obj, entity: response.data };
      }),
    );
    const resultFilter = resultRequests.filter(obj =>
      obj.hasOwnProperty('value'),
    ); // избавляемся от reject
    const result = resultFilter.map(obj => obj.value); // оставляем value из resolve
    return result;
  } catch (error) {
    console.log(error);
  }
}

/**
 * @description Replacing the URI contained in the search response to search the database for the foundation component. NOT USE. Do not delete.
 * @param {object[]} data - Array of objects received from search api with changed URI.
 * @return {Promise<object[]>} An array of objects with the addition of a property with an entity key containing a category from the database.
 */
async function getEntityFound(data) {
  try {
    const resultRequests = await Promise.allSettled(
      data.map(async obj => {
        const response = await search.api.apiGetEntityLin(obj.uriFound);
        return { ...obj, entityFound: response.data };
      }),
    );
    const resultFilter = resultRequests.filter(obj =>
      obj.hasOwnProperty('value'),
    ); // избавляемся от reject
    const result = resultFilter.map(obj => obj.value); // оставляем value из resolve
    return result;
  } catch (error) {
    console.log(error);
  }
}

/**
 * @description Removing duplicate rubrics from an array.
 * @param {object[]} arrayObjects - Array of objects with added entities.
 * @return {object[]} Array of objects with unique entities.
 */
function mapObjects(arrayObjects) {
  let newArrayObjects = [];
  for (let i = 0; i < arrayObjects.length; i++) {
    let isCoincidence = false;
    for (let j = i + 1; j < arrayObjects.length; j++) {
      if (arrayObjects[i].uri === arrayObjects[j].uri) {
        isCoincidence = true;
        break;
      }
    }
    if (!isCoincidence) {
      newArrayObjects.push(arrayObjects[i]);
    }
  }
  return newArrayObjects;
}

/**
 * @description Removing from the array of rubrics from chapters V X.
 * @param {object[]} arrayObjects - Array of objects with unique entities.
 * @return {object[]} Array of objects with unique entities without rubrics from chapters V X.
 */
function deleteChapters(arrayObjects) {
  const newArrayObjects = arrayObjects.filter(object => {
    return (
      object.code &&
      !(object.code[0] === 'V' || object.code[0] === 'X')
			);
		});
  return newArrayObjects;
}

/**
 * @description Replacing a category without a dot in the code with a child category '/other'.
 * @param {object[]} arrayObjects - Array of objects with unique entities without rubrics from chapters V X.
 * @return {Promise<object[]>} Array of objects with unique entities without rubrics from chapters V X and without rubrics without dot.
 */
async function getChild(arrayObjects) {
  try {
    const resultRequests = await Promise.allSettled(
      arrayObjects.map(async obj => {
        if (
          !obj.entity.code.includes('.') &&
          obj.entity.hasOwnProperty('child')
        ) {
          const response = await search.api.apiGetChild(obj.uri);
          let data = response.data;
          obj.entity = data;
        }
        return obj;
      }),
    );

    const resultFilter = resultRequests.filter(obj =>
      obj.hasOwnProperty('value'),
    ); // избавляемся от reject
    const result = resultFilter.map(obj => obj.value); // оставляем value из resolve
    return result;
  } catch (error) {
    console.log(error);
  }
}
