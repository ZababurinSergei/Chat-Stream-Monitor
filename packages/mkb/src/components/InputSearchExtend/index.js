import React, { memo, useEffect, useState } from 'react';
import './InputSearch.style.css';

import Loupe from '../img/Loupe/Loupe';
import CrossDelete from '../img/CrossDelete/CrossDelete';
import { isMobile } from "react-device-detect";
import isEmpty from "../../utilites/isEmpty";

const InputSearchExtend = memo(({
  children,
  inputValue,
  typeInputSearch,
  scaleEntity = [],
  wordForAddBySearchInInput = '',
  className = {},
  isOnlyEn,
  placeholder
}) => {
  const [text, setText] = useState('');
  const [isAddText, setIsAddText] = useState(false);

  useEffect(() => {
    if (
      wordForAddBySearchInInput &&
      wordForAddBySearchInInput[0] === 'wordBefore'
    ) {
      setText(prev => wordForAddBySearchInInput[1] + ' ' + prev);
			setIsAddText(prev => !prev);
    }
    if (
      wordForAddBySearchInInput &&
      wordForAddBySearchInInput[0] === 'wordsAfter'
			) {
				setText(prev => prev + ' ' + wordForAddBySearchInInput[1]);
				setIsAddText(prev => !prev);
    }
  }, [wordForAddBySearchInInput]);

	useEffect(() =>{

		inputValue(text, scaleEntity);
	}, [isAddText])

  const onChangeHandler = event => {
    const rusLang = /[а-яА-ЯёЁ]/.test(event.target.value)

    if(!isOnlyEn) {
      inputValue(event.target.value, scaleEntity);
      setText(event.target.value);
    } else {
      if(!rusLang) {
        inputValue(event.target.value, scaleEntity);
        setText(event.target.value);
      } else {
        // setText('');
      }
    }
  };

  const onClickHandlerLoupe = event => {
    inputValue(text, scaleEntity);
  };

  const onClickHandlerDelete = event => {
    inputValue('', scaleEntity);
    setText('');
  };

  if (typeInputSearch === 'input-search') {
    return (
      <>
        <div className={`${className.children__inputSearchExtend}`}>
          {children}
          <div
            className={`input-search__wrapper ${className.search__wrapper}`}
            tabIndex="0"
          >
            <input
              onChange={onChangeHandler}
              value={text}
              className={`input-search ${className.inputSearch}`}
              placeholder={!isEmpty(placeholder) ? placeholder : "Текст для поиска"}
            />
            <div
              className={`input-search__icon ${className.searchIcon}`}
              onClick={onClickHandlerLoupe}
            >
              <Loupe className={className} />
            </div>
            {/*{!isMobile &&*/}
              <div className="input-delete__icon" onClick={onClickHandlerDelete}>
                <CrossDelete className={className} />
              </div>
            {/*}*/}
          </div>
        </div>
      </>
    );
  } else if (typeInputSearch === 'disabled') {
    return (
      <>
        <div
          className="input-search__wrapper input-search__wrapper_disabled"
          tabIndex="0"
        >
          <input
            className="input-search input-search_disabled"
            placeholder="Недоступное поле"
            disabled
          />
          <div className="input-search__icon input-search__icon_disabled">
            <Loupe />
          </div>
        </div>
      </>
    );
  } else if (typeInputSearch === 'error') {
    return (
      <>
        <div className="input-search__wrapper input-search__wrapper_error">
          <input
            onChange={onChangeHandler}
            value={text}
            className="input-search"
            placeholder=" "
          />
          <div className="input-search__icon">
            <Loupe />
          </div>
          <div className="input-delete__icon" onClick={onClickHandlerDelete}>
            <CrossDelete />
          </div>
        </div>
      </>
    );
  }
});

export default InputSearchExtend;
