import React from 'react';
import './Bell.style.css';

function Bell({ className }) {
	className = className ? className : {}

	return (
		<div className={`bell-img__wrapper ${className['bell-img__wrapper']}`}>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M12 4C9.56696 4 7.4 6.25891 7.4 9.3V14C7.4 14.6989 7.2216 15.3928 6.91168 16H17.0883C16.7784 15.3928 16.6 14.6989 16.6 14V9.3C16.6 6.25891 14.433 4 12 4ZM20 16C19.736 16 19.4016 15.8466 19.095 15.4488C18.7915 15.0548 18.6 14.5182 18.6 14V9.3C18.6 5.3823 15.7526 2 12 2C8.24745 2 5.4 5.3823 5.4 9.3V14C5.4 14.5182 5.20854 15.0548 4.90496 15.4488C4.59839 15.8466 4.26398 16 4 16C3.44772 16 3 16.4477 3 17C3 17.5523 3.44772 18 4 18H20C20.5523 18 21 17.5523 21 17C21 16.4477 20.5523 16 20 16Z"
					fill="#6C8BC9"
				/>
				<path
					d="M14 20C14 21.1 13.1 22 12 22C10.89 22 10 21.1 10 20H14Z"
					fill="#6C8BC9"
				/>
			</svg>
		</div>
	);
}

export default Bell;
