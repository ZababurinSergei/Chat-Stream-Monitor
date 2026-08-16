import React, { useState, memo, useEffect } from 'react';
import style from './index.module.css';

const event = {
  target: {
    dataset: {
      text: '',
    },
    checked: false,
  },
};
const CheckBoxModal = memo(({
	i,
	handleCheck,
	item,
	// isSelect,
	checkedRu }) => {
  // const [check, setCheck] = useState(true);
  // const [check, setCheck] = useState(false);
  const [check, setCheck] = useState(false);

  useEffect(() => {
    if (checkedRu.includes(item)) {
      setCheck(true);
    }

    // console.log('[(CheckBoxModal): useEffect]: i=', i);
    // setCheck(!check);
  });

  // console.log('[(CheckBoxModal): props]: checkedRu=', checkedRu, i);
  // console.log('[(CheckBoxModal): props]: isSelect=', isSelect, i);
  // console.log('[(CheckBoxModal): useState]: check=', check, i);
  const onChangeHandler = _event => {
    // console.log('[(CheckBoxModal): onChangeHandler]: =', i);
    event.target.dataset.text = item;
    event.target.checked = !check;
    // console.log('[(CheckBoxModal): onChangeHandler]: event=', event, i);
    handleCheck(event);
    setCheck(prev => !prev);
  };

  return (
    <div className={style.wrapper}>
      <input
        type="checkbox"
        id={`checkbox${i}`}
        checked={check}
        className={style.checkbox}
        onChange={onChangeHandler}
        value={item}
      />
      <label htmlFor={`checkbox${i}`}></label>
    </div>
  );
});

export default CheckBoxModal;
