import React from 'react';
import style from './index.module.css';

function ModalResultSearchNull({ className }) {
  return (<div className={`${style.nullWrapper} ${className ? `${className.nullWrapper}`: ``}`}>
			<div className={style.text}>
				Поиск не дал никаких результатов
			</div>
        </div>);
}

export default ModalResultSearchNull;
