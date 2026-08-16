import React from 'react';
import './Check.style.css';

export function Check({className, width, height, isChecked}) {
	return (
		<div className={`check-img__wrapper ${className}`}>
			<svg
				width={width ? width: "16"}
				height={height? height: "16"}
				viewBox="0 0 16 16"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M12.7295 4.31606C13.1073 4.71897 13.0869 5.35181 12.6839 5.72954L6.66667 11.3707L3.31606 8.22954C2.91315 7.85181 2.89274 7.21897 3.27047 6.81606C3.6482 6.41315 4.28103 6.39274 4.68394 6.77047L6.66667 8.62927L11.3161 4.27047C11.719 3.89274 12.3518 3.91315 12.7295 4.31606Z"
					fill="white"
				/>
			</svg>
		</div>
	);
}

export default Check;
