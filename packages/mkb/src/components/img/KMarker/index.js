import React from 'react';
import style from './index.module.css';

function KMarker() {
	return (
		<div className={style.wrapper} data-type="kmarker">
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="10" cy="10" r="9.5" fill="#D9C5DC" stroke="#333333"/>
<path d="M7.08 5.6H8.52V9.608L12.072 5.6H13.8L10.656 9.032L14.04 14H12.288L9.696 10.028L8.52 11.3V14H7.08V5.6Z" fill="#333333"/>
</svg>
		</div>
	);
}

export default KMarker;
