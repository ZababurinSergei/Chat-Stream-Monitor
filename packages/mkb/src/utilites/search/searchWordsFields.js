import * as links from './links';
import { search } from './index';

export async function searchWordsFields(value, fields) {
  try {
    if (value.length >= 3) {
      const response = await search.api.apiSearchWordsFields(value, fields);
      const responseWithNewUri = changeArrayUriForGetLinearization(
        response.data,
      );

      const responseWithNewUriAndUriFound = changeUriForGetFoundation(responseWithNewUri);
      const newResponse = await getEntity(responseWithNewUriAndUriFound);
      const newResponseWithAll = await getEntityFound(newResponse);
      return newResponseWithAll;
    } else {
      return [];
    }
  } catch (error) {
    console.log(error);
  }
}

function changeUriForGetFoundation(data) {
  return data.map(obj => ({
    ...obj,
    uriFound: `${links.URL_PREF_FOUND}${obj.entityId}`,
  }));
}

// замена запроса для получения линейных болезней
function changeArrayUriForGetLinearization(data) {
  return data.map(obj => changeUriForGetLinearization(obj));
}

export function changeUriForGetLinearization(obj) {
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
      data.map(async obj => {
        // const response = await axios.get(obj.uri, links.optionsGetEntity);
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
function mapObjects(arrayObjects) {
  let newArrayObjects = [];
  for (let i = 0; i < arrayObjects.length; i++) {
    let isCoincidence = false;
    for (let j = i + 1; j < arrayObjects.length; j++) {
      if (arrayObjects[i].entityId === arrayObjects[j].entityId) {
        isCoincidence = true;
        break;
      }
    }

    if (!isCoincidence) {
      newArrayObjects.push(arrayObjects[i]);
    }
  }

  let sortArrayObjects = newArrayObjects.sort(
    (a, b) => a.entity.code - b.entity.code,
  );
  return newArrayObjects;
}

// удаляем из результатов рубрики из глав V X
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
