import React from 'react';
import style from './index.module.css';

function Index({height= 24, width = 24, className = {}}) {
	return (
		<>
			<div
				style={{
					width:width,
					height: height
				}}
				className={`${style[`arrow-img__wrapper`]} ${className['arrow-img__wrapper']}`}
			>
				<svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M1.41421 1.05529e-07C0.523309 6.65859e-08 0.077142 1.07714 0.707107 1.70711L3.29289 4.29289C3.68342 4.68342 4.31658 4.68342 4.70711 4.29289L7.2929 1.70711C7.92286 1.07714 7.47669 3.70528e-07 6.58579 3.31585e-07L1.41421 1.05529e-07Z"
					  	fill="#6C8BC9"
					/>
				</svg>
			</div>
		</>
	);
}

export default Index;
