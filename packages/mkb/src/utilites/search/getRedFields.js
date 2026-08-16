export function getRedFields(arrayObjects, word) {
  const regExp = new RegExp('(' + word + '[а-яёА-ЯË]*)', 'gi');
	let arrayResult = [];

  arrayObjects.map(object => {
		const objResult = {inscription: []};
		objResult.entityId = object.entityId;
		objResult.uri = object.uri;
		objResult.code = object.entity.code;

		if (object.title.match(regExp)) {
      objResult.title = object.title.replace(regExp, '<span>$1</span>');
    } else {
			objResult.title = object.title;
    }


		if (object.field !== 'title' && object.field === 'indexTerm') {
			object.entity.indexTerm.map((el) => {
				if (el.label['@value'].match(regExp)) {
					objResult.inscription.push(el.label['@value'].replace(
						regExp,
						'<span>$1</span>',
					))
				}
			})
		}

		if (object.field !== 'title' && object.field !== 'indexTerm' && Array.isArray(object.entityFound[object.field])) {
			object.entityFound[object.field].map((el) => {
				if (el.label['@value'].match(regExp)) {
					objResult.inscription.push(el.label['@value'].replace(
						regExp,
						'<span>$1</span>',
					))
				}
			})
		}
		arrayResult.push(objResult)
	});

	let newArrayResult = [];
	for (let i = 0; i < arrayResult.length; i++) {
		for (let j = i + 1; j < arrayResult.length; j++) {
			if (arrayResult[i].entityId === arrayResult[j].entityId) {
				arrayResult[i].inscription = [...arrayResult[i].inscription, ...arrayResult[j].inscription];
				arrayResult[j].del = true
			}
		}
		newArrayResult.push(arrayResult[i]);
	}
	newArrayResult = newArrayResult.filter((el) => !el.hasOwnProperty('del'))
	return newArrayResult;
}
