import React, { memo, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

import './InputSearch.style.css';

import Loupe from '../img/Loupe/Loupe';
import CrossDelete from '../img/CrossDelete/CrossDelete';
import { isMobile } from "react-device-detect";
import isEmpty from "../../utilites/isEmpty";
import { useDispatch } from 'react-redux';
import { checkBoxStateCheckedAction } from '../../modules/Main/reducers/checkbox';

const InputSearch = memo(({
  children,
  inputValue,
  typeInputSearch,
  scaleEntity = [],
  wordForAddBySearchInInput = '',
  className = {},
  isOnlyEn,
  placeholder,
  setText,
  text,
  isIconLoupe,
  length,
  typeModule
}) => {
  const [isAddText, setIsAddText] = useState(false);
  const [value] = useDebounce(text, 300);
  const dispatch = useDispatch();

  if(isIconLoupe === undefined) {
    isIconLoupe = true
  }

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
		dispatch(checkBoxStateCheckedAction.deleteStateChecked());
	    if(typeModule !== 'admin') {
          inputValue(value, scaleEntity);
        }
	}, [isAddText])

  const onChangeHandler = event => {
    const rusLang = /[а-яА-ЯёЁ]/.test(event.target.value)


    if(!isOnlyEn) {
      setText(event.target.value);
    } else {
      if(!rusLang) {
        if(length) {
          const text = event.target.value.replaceAll(' ', '')
          if(text.length <= length) {
            setText(text);
          }
        } else {
          setText(event.target.value);
        }
      }
    }
  };

	useEffect(() => {
		dispatch(checkBoxStateCheckedAction.deleteStateChecked());
		inputValue(value, scaleEntity);
	}, [value]);

  const onClickHandlerLoupe = event => {
		dispatch(checkBoxStateCheckedAction.deleteStateChecked());
        inputValue(value, scaleEntity);
  };

  const onClickHandlerDelete = event => {
      dispatch(checkBoxStateCheckedAction.deleteStateChecked());
      console.log('####################################')
      // inputValue('', scaleEntity);
      setText('');
  };

  if (typeInputSearch === 'input-search') {
    let resultText = typeModule === 'comparison'? text?.replaceAll(' ', ''): text

    return (
      <>
        <div className={`${className.children__inputSearch}`}>
          {children}
          <div
            className={`input-search__wrapper ${className.search__wrapper}`}
            tabIndex="0"
          >
            <input
              onChange={onChangeHandler}
              value={resultText}
              className={`input-search ${className.inputSearch}`}
              placeholder={!isEmpty(placeholder) ? placeholder : "Текст для поиска"}
            />
            {isIconLoupe &&  <div
                className={`input-search__icon ${className.searchIcon}`}
                onClick={onClickHandlerLoupe}
            >
              <Loupe className={className} />
            </div>}
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

export default InputSearch;
