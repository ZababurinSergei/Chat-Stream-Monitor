import React, {useState} from 'react';
import style from './index.module.css';
import Modal from '../Modal';
import ResultInsert from '../ResultInsert';

function Detail({ closeInsert }) {
	// const [insert, setInsert] = useState(false);

	const closeInsertHandler = () => {
		console.log('closeInsert');
		closeInsert();
	};

	return (
		<>
			<div className={style.wrapper}>
				<div className={style.title} onClick={closeInsertHandler}>
					Подробнее
				</div>
			</div>
		</>
	);
}

export default Detail;
