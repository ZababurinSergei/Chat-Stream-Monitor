import React from 'react';
import style from './index.module.css';

export const GreenCheck = ({ className = {}}) => {

	return (
		<div className={`${style.icon_wrapper} ${className.icon_wrapper}`}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g opacity="0.8">
					<path fillRule="evenodd" clipRule="evenodd" d="M18.6247 6.21917C19.056 6.56418 19.1259 7.19347 18.7809 7.62473L10.7809 17.6247C10.6032 17.8468 10.3393 17.9828 10.0553 17.9985C9.77129 18.0142 9.49403 17.9083 9.29289 17.7071L5.29289 13.7071C4.90237 13.3166 4.90237 12.6835 5.29289 12.2929C5.68342 11.9024 6.31658 11.9024 6.70711 12.2929L9.91708 15.5029L17.2191 6.37534C17.5641 5.94408 18.1934 5.87416 18.6247 6.21917Z" fill="#29CC6A"/>
				</g>
			</svg>
		</div>
	);
}