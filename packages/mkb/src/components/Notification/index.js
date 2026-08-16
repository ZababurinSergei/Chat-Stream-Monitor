import React, { useState } from 'react';
import style from './index.module.css';
import attention from './assets/attention.svg';
import close from './assets/close.svg';

export const Notification = () => {
  const [isShown, setIsShown] = useState(true);

  return (
    isShown && (
      <div className={style.container}>
        <div className={style.header}>
          <div className={style.attention}>
            <img src={attention}></img> На портале ВОЗ появилась новая версия МКБ-11
          </div>
          <div
            className={style.close}
            onClick={() => {
              setIsShown(false);
            }}
          >
            <img src={close}></img>
          </div>
        </div>
        {/* <div className={style.body}>
          На портале ВОЗ появилась новая версия МКБ-11
        </div> */}
      </div>
    )
  );
};
