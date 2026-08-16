import React from 'react';
import './Person.style.css';

function Person({className,  fill, fillOpacity }) {
	className = className ? className : {}
	return (
		<div className={`person-img__wrapper ${className['person-img__wrapper']}`}>
			<svg
				className={className['person-img__wrapper']}
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M15 7C15 8.65685 13.6569 10 12 10C10.3431 10 9 8.65685 9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7ZM15.5778 10.4928C16.4577 9.59155 17 8.3591 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 8.3591 7.54226 9.59155 8.42224 10.4928C5.23174 11.4153 3 13.5339 3 16C3 19.3137 7.02944 22 12 22C16.9706 22 21 19.3137 21 16C21 13.5339 18.7683 11.4153 15.5778 10.4928ZM12 12C9.8545 12 8.00257 12.5834 6.74544 13.4215C5.47433 14.2689 5 15.2199 5 16C5 16.7801 5.47433 17.7311 6.74544 18.5785C8.00257 19.4166 9.8545 20 12 20C14.1455 20 15.9974 19.4166 17.2546 18.5785C18.5257 17.7311 19 16.7801 19 16C19 15.2199 18.5257 14.2689 17.2546 13.4215C15.9974 12.5834 14.1455 12 12 12Z"
					fill = { fill }
					fillOpacity = { fillOpacity }
					// fill = '#FFF'
					// fillOpacity = "0.6"
				/>
			</svg>
		</div>
	);
}

export default Person;
