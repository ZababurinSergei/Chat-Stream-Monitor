import React from 'react';
import style from './index.module.css';

function CrossDeleteId() {
	return (
		<div className={style.wrapper}>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				id="svgCrossDeleteId"
			>
				<path
					d="M16.7069 8.70708C17.0974 8.31654 17.0974 7.68338 16.7068 7.29287C16.3163 6.90236 15.6831 6.90238 15.2926 7.29292L12 10.5859L8.70733 7.29292C8.31682 6.90238 7.68366 6.90236 7.29312 7.29287C6.90258 7.68338 6.90255 8.31654 7.29306 8.70708L10.5858 12.0001L7.29287 15.2934C6.90236 15.6839 6.90238 16.3171 7.29292 16.7076C7.68346 17.0981 8.31662 17.0981 8.70713 16.7075L12 13.4144L15.2928 16.7075C15.6833 17.0981 16.3165 17.0981 16.707 16.7076C17.0975 16.3171 17.0976 15.6839 16.7071 15.2934L13.4141 12.0001L16.7069 8.70708Z"
					fill="#E5E5EB"
					id="pathCrossDeleteId"
				/>
			</svg>
		</div>
	);
}

export default CrossDeleteId;
