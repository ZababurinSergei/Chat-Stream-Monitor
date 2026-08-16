import { apiGetEntityLin } from './apiGetEntityLin';
import { apiGetChild } from './apiGetChild';
import { apiSearchWords } from './apiSearchWords';
import { apiSearchWordsCoord } from './apiSearchWordsCoord';
import { apiSearchWordsFields } from './apiSearchWordsFields';
import { apiSearchCode, apiSearchCode_t } from './apiSearchCode';
import { apiSearchComparison } from './apiSearchComparison'
import { apiSearchWordsMain } from './apiSearchWordsMain';
import { apiSearchCodeCoord } from './apiSearchCodeCoord';

import { searchCode } from './searchCode';
import { searchWords } from './searchWords';
import { searchWordsCodeWithVX } from './searchWordsCodeWithVX';
import { searchWordsFields } from './searchWordsFields';
import { searchWordsCodeCoord } from './searchWordsCodeCoord';
import { searchWordsMain } from './searchWordsMain';

import { getResult } from './getResult';
import { getPerinatal } from './getPerinatal';
import { getMaternal } from './getMaternal';
import { getRed } from './getRed';
import { getChangeWords } from './getChangeWords';
import { getArrayIdScaleEntity } from './getArrayIdScaleEntity';
import { getResultForAdvancedSearch } from './getResultForAdvancedSearch';
import { getRedFields } from './getRedFields';
import { getResultCoord } from './getResultCoord';
import { getResultWithVX } from './getResultWithVX';
import { getResultMain } from './getResultMain';
import { getRedMainSearch } from './getRedMainSearch';
import { getDescendantsMain } from './getDescendantsMain';

import { filterChapter } from './filterChapter';
import { validationCode } from './validationCode';
import { changeUriForGetLinearization } from './searchWords';
import { makeRedWords } from './makeRedWords';

import { apiCodeInfo } from './apiCodeInfo'

export const decoder = {
  searchCode: searchCode,
  validationCode: validationCode,
};

export const search = {
  searchWords: searchWords,
  getResult: getResult,
  getPerinatal: getPerinatal,
  getMaternal: getMaternal,
  getRed: getRed,
  getRedFields: getRedFields,
  getChangeWords: getChangeWords,
  filterChapter: filterChapter,
  changeUriForGetLinearization: changeUriForGetLinearization,
	getArrayIdScaleEntity: getArrayIdScaleEntity,
	getResultForAdvancedSearch: getResultForAdvancedSearch,
	searchWordsFields: searchWordsFields,
	searchWordsCodeCoord: searchWordsCodeCoord,
	getResultCoord: getResultCoord,
	getResultWithVX: getResultWithVX,
	searchWordsCodeWithVX: searchWordsCodeWithVX,
	makeRedWords: makeRedWords,
	searchWordsMain: searchWordsMain,
	getResultMain: getResultMain,
	getRedMainSearch: getRedMainSearch,
	getDescendantsMain: getDescendantsMain,
  api: {
  	apiCodeInfo: apiCodeInfo,
  	apiSearchComparison: apiSearchComparison,
    apiSearchWords: apiSearchWords,
    apiGetEntityLin: apiGetEntityLin,
    apiGetChild: apiGetChild,
		apiSearchCode: apiSearchCode,
		apiSearchCode_t: apiSearchCode_t,
		apiSearchWordsFields: apiSearchWordsFields,
		apiSearchWordsCoord: apiSearchWordsCoord,
		apiSearchWordsMain: apiSearchWordsMain,
		apiSearchCodeCoord: apiSearchCodeCoord,
  },
};
