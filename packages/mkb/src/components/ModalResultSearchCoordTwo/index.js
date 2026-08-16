import React from 'react';
import style from './index.module.css';
import { idKey } from '../../utilites/idKey';
import DiseaseModalResultSearchCoordTwo from './DiseaseModalResultSearchCoordTow';

function ModalResultSearchCoordTwo({ diseases = [], view, getData }) {
	return (
    <div className={style[view]}>
      {diseases.map(disease => (
        <DiseaseModalResultSearchCoordTwo
          key={idKey()}
          disease={disease}
          getData={getData}
        />
      ))}
    </div>
  );
}

export default ModalResultSearchCoordTwo;
