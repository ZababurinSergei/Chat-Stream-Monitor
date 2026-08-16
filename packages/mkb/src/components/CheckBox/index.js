import React, { useState, memo, useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';
import style from './index.module.css';

const CheckBox = memo(({ i, stateChecked = false, getParamsFilter, typeCode }) => {
  const [check, setCheck] = useState(stateChecked);
	const [code, _setCode] = useState(typeCode);
	const dispatch = useDispatch();
	const store = useStore();

	useEffect(() => {
		if (store.getState().icd.checked.includes(typeCode)) {
			setCheck(false);
		}
	}, [])

  const onChangeHandler = event => {
    setCheck(prev => !prev);
    getParamsFilter({ state: event.target.checked, typeCode: code });
  };

  return (
    <div className={style.wrapper}>
      {' '}
      <input
        type="checkbox"
        id={`checkbox${i}`}
        className={style.checkbox}
        onChange={onChangeHandler}
        checked={check}
      />
      <label htmlFor={`checkbox${i}`}></label>
    </div>
  );
})

export default CheckBox;
