import React, { memo } from 'react';
import CheckBox from '../../CheckBox';
import CircleVoid from '../../img/CircleVoid';
import style from './index.module.css';

function CheckItem({
  type,
  i,
  numberOfChapters,
  stateChecked,
  getParamsFilter,
  typeCode,
}) {
  return (
    <>
      <div className={style.wrapper}>
        <div className={style.left}>
          <div className={style.checkBox}>
            <CheckBox
              i={i}
              stateChecked={stateChecked}
              getParamsFilter={getParamsFilter}
              typeCode={typeCode}
            />
          </div>
          <div className={style.circleVoid}>
            <CircleVoid fill={type.fill} />
          </div>
          <p className={style.checkTitle}>{type.title}</p>
        </div>
				<div className={style.right}>
					{numberOfChapters > 0
						? (<p className={`${style.checkTitle} ${style.checkTitleMany}`}>{numberOfChapters}</p>)
						: (<p className={style.checkTitle}>{numberOfChapters}</p>)
					}
        </div>
      </div>
    </>
  );
}

export default CheckItem;
