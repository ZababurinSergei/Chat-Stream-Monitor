import React from 'react';
import style from './index.module.css';

import { idKey } from '../../utilites/idKey';

import CrossDelete from '../img/CrossDelete/CrossDelete';
import DiseaseModalResultSearchField from '../ModalResultSearchField/DiseaseModalResultSearchField';

function ResultSearchField({
	setToc,
  setExpand,
  setUpdateToc,
  view,
	diseases = [],
	close
}) {
  return (
    <div className={style.wrapper}>
      <div className={style.header}>
        <div className={style.header__title}>
          Результаты расширенного поиска
        </div>
        <div className={style.header__crossClose} onClick={() => close()}>
          <CrossDelete fillColor={'var(--black-15per)'} />
        </div>
      </div>
			<div className={style.deseasesList}>
        {diseases.map(disease => {
          return (
            <DiseaseModalResultSearchField
              setToc={setToc}
              setExpand={setExpand}
              setUpdateToc={setUpdateToc}
              key={idKey()}
              disease={disease}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ResultSearchField;
