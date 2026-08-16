import React, {useState} from 'react';

import './input.style.css';

import Loupe from '../img/Loupe/Loupe';
import CrossDelete from '../img/CrossDelete/CrossDelete';

function Input({inputValue}) {
	const [text, setText] = useState('');

	const onChangeHandler = (event) => {
		console.log('onChangeHandler', text);
		setText(event.target.value);
		inputValue(event.target.value);
	};

	const onClickHandlerDelete = (event) => {
		console.log('onClickHandlerDelete');
		setText('');
	};

	return (
		<div className="inputs">

			<div className="input-search__wrapper" tabIndex="0">
				<input
					onChange={onChangeHandler}
					value={text}
					className="input-search"
					placeholder="Текст для поиска"
				/>
				<div className="input-search__icon">
					<Loupe />
				</div>
				<div className="input-delete__icon" onClick={ onClickHandlerDelete }>
					<CrossDelete />
				</div>
			</div>

			<div className="input-search__wrapper-dis" tabIndex="0">
				<input
					className="input-search-dis"
					placeholder="Недоступное поле"
					disabled
				/>
				<div className="input-search__icon-dis">
					<Loupe />
				</div>
			</div>

			<div className="input-search__wrapper input-error">
				<input
					onChange={onChangeHandler}
					value={text}
					className="input-search"
					placeholder="Ошибка"
				/>
				<div className="input-search__icon">
					<Loupe />
				</div>
				<div className="input-delete__icon" onClick={ onClickHandlerDelete }>
					<CrossDelete />
				</div>
			</div>
			{/* <p className='input-search__signature-error'>
				Это значение некорректно
			</p> */}




			<div className="input-text__wrapper" tabIndex="0">
				<input
					onChange={onChangeHandler}
					value={text}
					className="input-text"
					placeholder=' '
				/>
				<label className='label-text'>Наименование</label>
				<div className="input-text__icon" onClick={ onClickHandlerDelete }>
					<CrossDelete />
				</div>
			</div>

			<div className="input-text__wrapper-dis" tabIndex="0">
				<input
					onChange={onChangeHandler}
					value="Недоступное поле"
					className="input-text-dis"
					placeholder=' '
					disabled
				/>
				<label className='label-text-dis'>Наименование</label>
			</div>


			<div className="input-text__wrapper input-error" tabIndex="0">
				<input
					onChange={onChangeHandler}
					value="Ошибка"
					className="input-text"
					placeholder=" "
				/>
								<label className='label-text'>Наименование</label>

				<div className="input-text__icon" onClick={ onClickHandlerDelete }>
					<CrossDelete />
				</div>
			</div>
			{/* <p className='input-text__signature-error'>
				Это значение некорректно
			</p> */}


			<div className='textareas'>
				<div className="textarea-text__wrapper" tabIndex="0">
					<textarea
						onChange={onChangeHandler}
						value={text}
						className="textarea-text"
						placeholder=' '
					></textarea>
					<label className='label-text'>Наименование</label>
				</div>

				<div className="textarea-text__wrapper-dis" tabIndex="0">
					<textarea
						onChange={onChangeHandler}
						value="Недоступное поле"
						className="textarea-text-dis"
						placeholder=' '
						disabled
					></textarea>
					<label className='label-text-dis'>Наименование</label>
				</div>


				<div className="textarea-text__wrapper textarea-error" tabIndex="0">
					<textarea
						onChange={onChangeHandler}
						value="Ошибка"
						className="textarea-text"
						placeholder=" "
					></textarea>
					<label className='label-text'>Наименование</label>
				</div>


			</div>
		</div>
	);
}

export default Input;
