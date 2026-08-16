import * as links from './links'

/**
 * Samething type. Correct in future.q
 * @typedef {any} arrayScaleEntity
 */

/**
 * Getting array id of scale entity
 * @param {arrayScaleEntity} arrayScaleEntity
 * @returns {arrayScaleEntity}
 */
export	function getArrayIdScaleEntity(arrayScaleEntity) {
	if (arrayScaleEntity.length > 0) {
		const result =  arrayScaleEntity.map(scaleEntity => {
			if(!scaleEntity.id) {
				scaleEntity.id = scaleEntity['@id']
			}
			return 	scaleEntity.id.replace(links.URL_LOCALHOST_STANDART_V1, links.URL_PREF_BASE)
		})

		return result
	}
	return arrayScaleEntity;
};

