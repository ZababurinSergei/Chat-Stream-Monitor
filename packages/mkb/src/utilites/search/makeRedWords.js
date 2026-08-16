export function makeRedWords(arrayObjects, word) {
	let regExp;
	let regExpSpecSimbol = new RegExp('[^\.a-zA-Z0-9а-яёА-ЯË\s,]', 'gi');
	if (!regExpSpecSimbol.test(word)) {
		regExp = new RegExp('(' + word + '[а-яёА-ЯË]*)', 'gi');
	} else {
		regExp = /askldfasdlkjasdkfjaslsigurnyviverdkfasldkfasldkfjasldkfj/;
	}

arrayObjects.map(object => {
	if (object.title.match(regExp)) {
		object.title = object.title.replace(regExp, '<span>$1</span>');
		object.isSearchWord = true;

	} else {
		if (object.isSearchWord) {
			object.isSearchWord = true;
		} else {
			object.isSearchWord = false;
		}
	}

	if (
		object.entity.indexTerm?.length > 0 &&
		Array.isArray(object.entity.indexTerm)
	) {
		object.entity.indexTerm.map(obj => {
			if (obj.label['@value'].match(regExp)) {
				obj.label['@value'] = obj.label['@value'].replace(
					regExp,
					'<span>$1</span>',
				);
			}

			if (`<span>${word.toLowerCase()}</span>` === obj.label['@value'].toLowerCase()) {
				obj.label.isBlueIndexTerm = true;
			} else {
				if (obj.label.isBlueIndexTerm) {
					obj.label.isBlueIndexTerm = true;
				} else {
					obj.label.isBlueIndexTerm = false;
				}
			}

			return obj;
		});

		if (!object.isIndexTermLength) {
			object.entity.indexTerm = object.entity.indexTerm.filter(
				obj => obj.hasOwnProperty('label') && obj.label['@value'].match(regExp)
			);
		}
	}

	if (object.entity.indexTerm?.length === 0) {
		object.isIndexTermLength = false;
	} else {
		object.isIndexTermLength = true;
	}

	if (`<span>${word.toLowerCase()}</span>` === object.title.toLowerCase()) {
		object.entity.isBlueTitle = true;
	} else {
		if (object.entity.isBlueTitle) {
			object.entity.isBlueTitle = true;
		} else {
			object.entity.isBlueTitle = false;
		}
	}

	return object;
});

return arrayObjects;
}
