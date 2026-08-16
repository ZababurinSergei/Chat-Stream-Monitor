import React, { useEffect, useState } from 'react';
import style from './index.module.css';

function IndexTermModalResultSearch({ term, i = 1, onClickOpen }) {

  const onClickHandler = event => {
		event.preventDefault();
		event.stopPropagation();
		onClickOpen();
  };

  const [isNull, setIsNull] = useState();
  useEffect(() => {
    if (i === 0) {
      setIsNull(true);
    }
  });

  return (
    <>
      {isNull ? (
        <div className={style.wrapper}>
          <div
            className={style.iTerm}
            dangerouslySetInnerHTML={{ __html: term.label['@value'] }}
          ></div>
          <div className={style.icon} onClick={onClickHandler}>
            ▤
          </div>
        </div>
      ) : (
        <div className={style.wrapper}>
          <div
            className={style.iTerm}
            dangerouslySetInnerHTML={{ __html: term.label['@value'] }}
          ></div>
        </div>
      )}
    </>
  );
}

export default IndexTermModalResultSearch;
