import React from 'react';
import style from './index.module.css';

function CopyLineCode({ pageCode }) {
  return (
    <div className={style.wrapper}>
      <div className={style.codeTitle}>Код:</div>
      <div className={style.codeText}>
        {pageCode}
      </div>
    </div>
  );
}

export default CopyLineCode;
