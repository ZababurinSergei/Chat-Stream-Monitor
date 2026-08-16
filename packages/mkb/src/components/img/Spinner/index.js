import React from 'react';
import style from './index.module.css';
import spinner from './spinner.gif'

export const Spinner = () => {
	return (
		<img className={style.spinner} src={spinner} alt="Загрузка..." />
	);
}