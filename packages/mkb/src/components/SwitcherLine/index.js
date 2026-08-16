import React, { useRef } from 'react';
import Switcher from '../Switcher';
import style from './index.module.css';

function SwitcherLine(props) {
	const checkRef = useRef();

	const onClickHandler = event => {
		console.log(checkRef);
	}


	return (
		<div className={style.wrapper}>
		<p className={style.title}>Представление записи строкой</p>
		<label class={style.switch} onClick={onClickHandler}>
				<input type="checkbox" ref={checkRef}/>
				<span class={`${style.slider} ${style.round}`}></span>
			</label>
		<p className={style.title}>Представление записи иерархией</p>
		</div>
	);
}

export default SwitcherLine;


// NA07.20&XC16&XC4L/PB80&XE47R/PA00&XE43G
