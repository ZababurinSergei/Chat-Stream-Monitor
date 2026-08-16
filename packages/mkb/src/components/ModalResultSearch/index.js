import React from 'react';
import style from './index.module.css';

import { idKey } from '../../utilites/idKey';

import DiseaseModalResultSearch from './DiseaseModalResultSearch';

function ModalResultSearch({
  setToc,
  setExpand,
  setUpdateToc,
  diseases = [],
  view,
  className,
  onClickCloseMainModalResultSearch
}) {
  if (diseases.length >= 60) {
    return (
      <div className={`${style[view]} ${className ? `${className.mainWrapper}`: ``}`}>
        {diseases.map((disease, index) => {
          if (index < 60) {
            return (
              <DiseaseModalResultSearch
                setToc={setToc}
                setExpand={setExpand}
                setUpdateToc={setUpdateToc}
                className={className}
                key={idKey()}
                disease={disease}
                onClickCloseMainModalResultSearch={onClickCloseMainModalResultSearch}
              />
            );
          }
        })}
        <p className={style.infoSearchText}>
          Отображены не все результаты поиска. Вы можете уточнить поисковой
          запрос.
        </p>
      </div>
    );
  } else {
    return (
      <div className={`${style[view]} ${className ? `${className.ModalResultSearch}`: ``}`}>
        {diseases.map(disease => (
          <DiseaseModalResultSearch
            setToc={setToc}
            setExpand={setExpand}
            setUpdateToc={setUpdateToc}
            className={className}
            key={idKey()}
            disease={disease}
            onClickCloseMainModalResultSearch={onClickCloseMainModalResultSearch}
          />
        ))}
      </div>
    );
  }
}

export default ModalResultSearch;
