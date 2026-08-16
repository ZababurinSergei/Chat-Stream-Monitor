import React, { memo, useEffect, useState } from 'react';
import style from './index.module.css';

import Arrow from '../../img/Arrow/Arrow';
import CheckItem from '../CheckItem';

import { typesOfRings } from '../__mocks__/typesOfRings';
import { idKey } from '../../../utilites/idKey';

const Filters = memo(({ dataFilter, getParamsFilter, openCloseFilter }) => {
  const [activeClass, setActiveClass] = useState(false);
	const [data, setData] = useState(dataFilter);

  const onClickHandler = () => {
		setActiveClass(!activeClass);
		openCloseFilter();
  };

  return (
    <div className={style.wrapper}>
      <div className={style.selectListWrapper}>
        <div className={style.text} onClick={onClickHandler}>
          {activeClass ? 'Фильтр' : 'Фильтр'}
        </div>
        <div
          className={
            activeClass
              ? `${style.rotateArrow} ${style.rotateArrowActive}`
              : `${style.rotateArrow}`
          }
          onClick={onClickHandler}
        >
          <Arrow />
        </div>
      </div>
      <div
        className={
          activeClass
            ? `${style.selectMenuContainer} ${style.selectMenuContainerActive}`
            : `${style.selectMenuContainer}`
        }
      >
        {activeClass && (
          <div className={style.menu}>
            <h4 className={style.h4}>Распределение классов / фильтр</h4>
            <div className={style.filterBox}>
              {typesOfRings.map((type, i) => {
                if (dataFilter.isFull && dataFilter.hasOwnProperty(type.code)) {
                  return (
                    <CheckItem
                      key={idKey()}
                      type={type}
                      i={i}
                      numberOfChapters={dataFilter[type.code]}
                      stateChecked={true}
                      getParamsFilter={getParamsFilter}
                      typeCode={type.code}
                    />
                  );
                } else {
								return (
                  <CheckItem
                    key={idKey()}
                    type={type}
                    i={i}
                    numberOfChapters={0}
                    stateChecked={false}
                    getParamsFilter={getParamsFilter}
                    typeCode={''}
                  />
                )};
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
})

export default Filters;
