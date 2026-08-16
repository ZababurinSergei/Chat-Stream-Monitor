import React, { useState } from 'react';
import { search } from '../utilites/search';


export function useInputPostCoord() {
	const [isResult, setIsResult] = useState(false);
	const [infoResult, setInfoResult] = useState([]);

	async function inputValue(value, scale = []) {
		try {
			const response = await search.getResult(value, scale);
			if (response && response.length > 0) {
				setInfoResult(response);
				setIsResult(true);
				// console.log('[(Editor): inputValue]: (response && response.length > 0)=', response)
				// dispatch(searchActions.setResultSearch({response, isResponse: true, wordForResponse: value}));
			} else {
				setInfoResult([]);
				setIsResult(false);

				// dispatch(searchActions.deleteResultSearch({wordForResponse: value}));

			};
		} catch (err) {
			console.log(err);
		};
	};
	return {inputValue, isResult, infoResult}
};
