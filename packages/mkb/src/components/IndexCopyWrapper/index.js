import React from 'react';
import Index from '../img/colspanTree';
import style from './index.module.css';

function IndexCopyWrapper({className = {}}) {
	return (
		<div className={`${style.wrapper} ${className.copyWrapper}`}>
			<Index/>
		</div>
	);
}

export default IndexCopyWrapper;
