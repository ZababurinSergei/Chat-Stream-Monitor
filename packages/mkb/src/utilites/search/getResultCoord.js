import { search } from './index';
export async function getResultCoord(value, scale = [], fields = []) {
	value = value.trim();
	// получаем данные по поиску
	let dataSearch = await search.searchWordsCodeCoord(value.trim(), scale, fields);
	// получаем выделение для искомых данных
	let data = search.getRed(dataSearch, value);
	// получаем массив с названиями болезней
	const arrayTitles = data.map(el => el.title);
	return getUnicCoord(data);
};

function getUnicCoord(array) {
	if (array.length > 1) {
		let newArray = [];
		for (let i = 0; i < array.length - 1; i++) {
			let isDubl = false;
			for (let j = i + 1; j < array.length; j++) {
				if (array[i].entityId === array[j].entityId) {
					isDubl = true;
					break;
				}
			};
			if (!isDubl) {
				newArray.push(array[i]);
			};
		};
		newArray.push(array[array.length - 1]);
		return newArray;
	};
	return array;
};

