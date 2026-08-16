import { search } from './index';
/**
 * Get search results on the coding page.
 * @param {string} value - The word that the user entered into the input on the encoding page.
 * @returns {any}
 */
export async function getResult(value) {
	value = value.trim();
  // получаем данные по поиску
  let dataSearch = await search.searchWords(value.trim());
  // получаем данные для перинатальной главы
  let dataPerinatal = await search.getPerinatal(dataSearch);
  console.log('dataPerinatal', dataSearch, dataPerinatal)

  // получаем данные для материнской главы
  let dataMaternal = await search.getMaternal(dataPerinatal);
  // получаем выделение для искомых данных
  let data = search.getRedMainSearch(dataMaternal, value);
  // получаем массив с названиями болезней
  const arrayTitles = data.map(el => el.title);
  // массив для получения данных для вывода
  let resultTitleArray = [];
  // получаем названия болезней, которые содержат value, и индекс этой болезни в массиве болезней
  for (let i = 0; i < arrayTitles.length; i++) {
    const arrayTitleWords = arrayTitles[i].split(' ');
    let isHasTitle = false;
    for (let j = 0; j < arrayTitleWords.length; j++) {
      // если в названии болезней находится искомое слово, то сохраняем ссылку и название
      if (arrayTitleWords[j].toLowerCase().includes(value)) {
        resultTitleArray.push({
          title: data[i].title,
          uri: data[i].uri,
          entity: data[i].entity,
          id: data[i].entityId,
          field: data[i].field,
        });
        isHasTitle = true;
        break;
      }
      // если в названии не находится искомое слово, то сохраняем еще и описание
      if (j === arrayTitleWords.length - 1 && !isHasTitle) {
        resultTitleArray.push({
          title: data[i].title,
          uri: data[i].uri,
          fragments: data[i].fragments,
          entity: data[i].entity,
          id: data[i].entityId,
          field: data[i].field,
        });
      }
    }
  }
  return resultTitleArray;
}
