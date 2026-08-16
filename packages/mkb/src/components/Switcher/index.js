import React, { useRef } from 'react';
import style from './index.module.css';

function Switcher() {
	const checkRef = useRef();

	const onClickHandler = event => {
		console.log(checkRef);
	}

	return (
			<label class={style.switch} onClick={onClickHandler}>
				<input type="checkbox" ref={checkRef}/>
				<span class={`${style.slider} ${style.round}`}></span>
			</label>
	);
}

export default Switcher;


// NA07.20&XC16&XC4L/PB80&XE47R/PA00&XE43G
