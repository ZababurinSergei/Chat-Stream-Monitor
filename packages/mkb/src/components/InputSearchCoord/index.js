import React, { memo, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import './InputSearch.style.css';

import Loupe from '../img/Loupe/Loupe';
import CrossDelete from '../img/CrossDelete/CrossDelete';
import { isMobile } from 'react-device-detect';

import { useDispatch, useSelector, useStore } from 'react-redux';
import { inputSearchCoordActions } from '../../modules/Main/reducers/inputSearchCoord';

const InputSearchCoord = memo(
  ({
    children,
		inputValue,
    typeInputSearch,
		scaleEntity = [],
		scaleEntityGrayNotes = [],
    className,
    axisName,
  }) => {
    className = className ? className : {};
    const dispatch = useDispatch();
    const store = useStore();
		const [text, setText] = useState('');
		const [entityScale, setEntityScale] = useState([])
		const [entityScaleGrayNotes, setEntityScaleGrayNotes] = useState([])
		const [value] = useDebounce(text, 800);

    // if (store.getState().icd.inputSearchCoord.axisName === axisName) {
    // 	setText(store.getState().icd.inputSearchCoord.inputSearchCoordValue);
    // };
		useEffect(() => {

			if (
				store.getState().icd.inputSearchCoord.axisName === axisName &&
				store.getState().icd.inputSearchCoord.inputSearchCoordValue
			) {
				setText(store.getState().icd.inputSearchCoord.inputSearchCoordValue);
				setEntityScale(store.getState().icd.inputSearchCoord.scaleEntityNotes);
				setEntityScaleGrayNotes(store.getState().icd.inputSearchCoord.scaleEntityNotesGray);
				inputValue(store.getState().icd.inputSearchCoord.inputSearchCoordValue, store.getState().icd.inputSearchCoord.scaleEntityNotes, store.getState().icd.inputSearchCoord.scaleEntityNotesGray);
			}
		}, [])

    const onChangeHandler = event => {
			inputValue(event.target.value, scaleEntity, scaleEntityGrayNotes);

			setText(event.target.value);
			setEntityScale(scaleEntity);
			setEntityScaleGrayNotes(scaleEntityGrayNotes);

      dispatch(
        inputSearchCoordActions.setResultSearch({
          inputSearchCoordValue: event.target.value,
					axisName,
					scaleEntityNotes: scaleEntity,
					scaleEntityNotesGray: scaleEntityGrayNotes,
        }),
      );
    };

    const onClickHandlerLoupe = event => {
      inputValue(text, entityScale, entityScaleGrayNotes);
    };

    const onClickHandlerDelete = event => {
      inputValue('', entityScale, entityScaleGrayNotes);
      setText('');
      dispatch(inputSearchCoordActions.deleteResultSearch());
    };

    if (typeInputSearch === 'input-search') {
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
                value={text}
                className={`input-search ${className.inputSearch}`}
                placeholder="Текст для поиска"
              />
              <div
                className={`input-search__icon ${className.searchIcon}`}
                onClick={onClickHandlerLoupe}
              >
                <Loupe className={className} />
              </div>
              {/*{!isMobile &&*/}
              <div
                className="input-delete__icon"
                onClick={onClickHandlerDelete}
              >
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
  },
);

export default InputSearchCoord;
