import React from 'react';
import style from './index.module.css';

import { idKey } from '../../utilites/idKey';

import DiseaseModalResultSearchField from './DiseaseModalResultSearchField';

function ModalResultSearchField({
  setToc,
  setExpand,
  setUpdateToc,
  diseases = [],
  view,
}) {
  return (
    <div className={style[view]}>
      {diseases.map(disease => (
        <DiseaseModalResultSearchField
            setToc={setToc}
            setExpand={setExpand}
            setUpdateToc={setUpdateToc}
            key={idKey()}
            disease={disease}
        />
      ))}
    </div>
  );
}

export default ModalResultSearchField;
