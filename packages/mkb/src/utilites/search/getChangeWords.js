// функция предназначена для отбора слов для Списка слов
/**
 * Selection of words for the Word List.
 * @param {any} array
 * @returns {any}
 */
export function getChangeWords(array) {
  const reg = /([А-Яа-я-\w]*)[ ]?<span>.*<\/span>[ ]?([А-Яа-я\w]*)/i;
  // const reg = /([А-Яа-я-\w]*)[ к|с|на|по|от|из|в|а|но|для ]?<span>.*<\/span>[ к|с|по|от|из|в|а|но|на|для ]?([А-Яа-я\w]*)/i;

  const words = getArrayStrings(array);

  let arr = words.map(str => {
    return str.match(reg);
  });
  const arrayWithGroupWords = distributionWords(arr);
  const arrayWordsWithOdj = getArrayWordsForPage(arrayWithGroupWords);
  const arrayWordsForPage = sortWords(arrayWordsWithOdj);
  return arrayWordsForPage;
}

function getArrayStrings(array) {
  let words = [];
  array.map(object => {
    words.push(object.title);
    object.entity.indexTerm?.map(label => {
      return words.push(label.label['@value']);
    });
  });
  return words;
}

function distributionWords(arrayForDistribution) {
  let arrayWithResultDistribution = [];
  for (let groups of arrayForDistribution) {
    if (Array.isArray(groups)) {
      arrayWithResultDistribution.push({
        wordBefore: groups[1],
        wordsAfter: groups[2],
      });
    }
  }
  return arrayWithResultDistribution;
}

function getArrayWordsForPage(arrayObjectsWords) {
  let arrayWordsForPage = [];
  let arrayControlRepeatBefore = [];
  let arrayControlRepeatAfter = [];
  for (let object of arrayObjectsWords) {
    for (let key in object) {
      let word = object[key].toLowerCase();
      // если строка не пустая и в контрольных массивах нет такого слова
      if (
        word &&
        !arrayControlRepeatBefore.includes(word) &&
        !arrayControlRepeatAfter.includes(word)
      ) {
        arrayWordsForPage.push({
          [key]: word,
        });
        if (key === 'wordBefore' && !arrayControlRepeatBefore.includes(word)) {
          arrayControlRepeatBefore.push(word);
        }
        if (key === 'wordsAfter' && !arrayControlRepeatAfter.includes(word)) {
          arrayControlRepeatAfter.push(word);
        }
      }
    }
  }
  return arrayWordsForPage;
}

function sortWords(words) {
  return words.map(word => Object.entries(word));
}
