import { search } from './index';

export function getRed(arrayObjects, word) {
	const blueArrayObjects = JSON.parse(JSON.stringify(arrayObjects));
	search.makeRedWords(arrayObjects, word);
	let newWords = word.split(" ");
	newWords.map(word => {
		search.makeRedWords(arrayObjects, word);
	})

	const newArrayObjects = arrayObjects.filter(
		object => object.isSearchWord || object.isIndexTermLength,
  );
  return newArrayObjects;
}
