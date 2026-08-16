import { search } from './index';
export async function getResultWithVX(value, scale = [], fields = []) {
  value = value.trim();
  let dataSearch = await search.searchWordsCodeWithVX(value, scale, fields);
  let dataPerinatal = await search.getPerinatal(dataSearch);
  let dataMaternal = await search.getMaternal(dataPerinatal);
  let data = search.getRed(dataMaternal, value);
  const arrayTitles = data.map(el => el.title);
  let resultTitleArray = [];

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
