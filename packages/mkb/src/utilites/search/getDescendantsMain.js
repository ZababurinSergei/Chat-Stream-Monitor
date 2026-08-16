import * as links from './links';
import { search } from './index';

/*
	Функция getDescendantsMain принимает word - искомое слово, и arrayObjects - подготовленный для передачи
	в компоненты массив найденных сущностей.
	В функции getDescendantsMain обрабатывается каждая сущность из массива.
	Если в объекте сущности есть свойство descendants, то оно:
		- получает корректную ссылку для получения объекта entity;
		- получает объект entity;
		- получает тэги <span> для окрашивания искомых слов в title и indexTerm в entity.
	Далее функция рекурсивно обрабатывает массив уже подготовленный для передачи в компоненты
	массив descendants для обработки следующего уровня вложенных descendants.
*/
export async function getDescendantsMain(word, arrayObjects, type = {isAdmin: false}) {
	try {
		const result = await Promise.allSettled(arrayObjects.map(async object => {
			if (!object.descendants) return object;
			const responseWithNewUri = changeArrayUriForGetLinearization(object.descendants);
			const newResponse = await getEntity(responseWithNewUri);
			const redArray = search.getRedMainSearch(newResponse, word, type);
			const endResult = await getDescendantsMain(word, redArray, type);
			object.descendants = newResponse;
			return object;
		}))

		const resultFilter = result.filter(obj =>
			obj.hasOwnProperty('value'),
        );
		const resultMap = resultFilter.map(obj => obj.value); // оставляем value из resolve
		return resultMap;
	} catch (error) { console.log(error) }
}

// замена запроса для получения линейных болезней
/**
 * @description Замена содержащихся в ответе поиска uri для поиска в базе данных по таблице linearization.
 * @param {object[]} data - Массив объектов, полученный из api поиска.
 * @return {object[]} Массив объектов с измененным uri у каждого.
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

// получаем массив со значениями болезней
/**
 * @description Замена содержащихся в ответе поиска uri для поиска в базе данных по компоненту linearization.
 * @param {object[]} data - Массив объектов, полученный из api поиска c измененными uri.
 * @return {object[]} Массив объектов с добалением свойства с ключем entity, содержащим категорию из базы данных.
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

async function getEntityFound(data) {
  try {
    const resultRequests = await Promise.allSettled(
      data.map(async obj => {        // const response = await axios.get(obj.uri, links.optionsGetEntity);
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

// убираем повторяющиеся entityId
/**
 * @description Удаление из массива повторяющихся рубрик.
 * @param {object[]} arrayObjects - Массив объектов с добавленными entity.
 * @return {object[]} Массив объектов с уникальными entity.
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

// удаляем из результатов рубрики из глав V X
/**
 * @description Удаление из массива рубрики из глав V X.
 * @param {object[]} arrayObjects - Массив объектов с уникальными entity.
 * @return {object[]} Массив объектов с уникальными entity без рубрик из глав V X.
 */
function deleteChapters(arrayObjects) {
  const newArrayObjects = arrayObjects.filter(object => {
    return (
      object.entity.code &&
      !(object.entity.code[0] === 'V' || object.entity.code[0] === 'X')
			);
		});
  return newArrayObjects;
}

// замена кода без точки и с child
/**
 * @description Замена рубрики без точки в коде на дочернюю категорию '/other'.
 * @param {object[]} arrayObjects - Массив объектов с уникальными entity без рубрик из глав V X.
 * @return {object[]} Массив объектов с уникальными entity без рубрик из глав V X и без рубрик без точки.
 */
async function getChild(arrayObjects) {
  try {
    const resultRequests = await Promise.allSettled(
      arrayObjects.map(async obj => {
        let data = obj;
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
