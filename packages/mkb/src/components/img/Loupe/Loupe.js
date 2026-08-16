import React from 'react';
import './Loupe.style.css';

function Loupe({className}) {
	return (
		<div className={`loupe-img__wrapper ${className.img__wrapper}`}>
			<svg
				width="15"
				height="15"
				viewBox="0 0 15 15"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M9.47645 10.8908C8.49564 11.5892 7.29579 12 6 12C2.68629 12 0 9.31371 0 6C0 2.68629 2.68629 0 6 0C9.31371 0 12 2.68629 12 6C12 7.29587 11.5892 8.49579 10.8907 9.47662L14.7071 13.293C15.0976 13.6836 15.0976 14.3167 14.7071 14.7073C14.3166 15.0978 13.6834 15.0978 13.2929 14.7073L9.47645 10.8908ZM10 6C10 8.20914 8.20914 10 6 10C3.79086 10 2 8.20914 2 6C2 3.79086 3.79086 2 6 2C8.20914 2 10 3.79086 10 6Z"
					fill="#6C8BC9"
				/>
			</svg>
		</div>
	);
}

export default Loupe;
