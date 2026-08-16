import React from 'react';
import style from './index.module.css';

function PlusMarker({ color, className = {}, onClick }) {
	return (
		<div
			onClick={onClick}
			className={`${style.icon_wrapper} ${className.icon_wrapper}`}
			data-type='plusmarker'
		>
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="10" cy="10" r="9.5" fill={ color } stroke="#333333"/>
				<path d="M11 6C11 5.44772 10.5523 5 10 5C9.44772 5 9 5.44772 9 6V9H6C5.44772 9 5 9.44772 5 10C5 10.5523 5.44772 11 6 11H9V14C9 14.5523 9.44772 15 10 15C10.5523 15 11 14.5523 11 14V11H14C14.5523 11 15 10.5523 15 10C15 9.44772 14.5523 9 14 9H11V6Z" fill="#333333"/>
			</svg>
		</div>
	);
}

export default PlusMarker;
