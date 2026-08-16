import React, { useState } from 'react';
import './SelectList.style.css';

import Arrow from '../../img/Arrow/Arrow';
import FilterMenu from '../FilterMenu/';

function SelectList({ selectOption, filterCategories }) {
  const [activeClass, setActiveClass] = useState(false);

  const onClickHandler = () => {
    setActiveClass(!activeClass);
  };

  return (
    <>
      {activeClass && (
        <div className="close-wrapper" onClick={onClickHandler}></div>
      )}
      <div className="select-list__wrapper">
        <div className="select-list__text" onClick={onClickHandler}>
          Сортировать
        </div>
        <div
          className={
            activeClass ? 'rotate-arrow rotate-arrow_active' : 'rotate-arrow'
          }
          onClick={onClickHandler}
        >
          <Arrow />
        </div>
        <div
          className={
            activeClass
              ? 'select-menu__container select-menu__container_active'
              : 'select-menu__container'
          }
        >
          {activeClass && (
            <>
              <FilterMenu
                selectOption={selectOption}
                filterCategories={filterCategories}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default SelectList;
