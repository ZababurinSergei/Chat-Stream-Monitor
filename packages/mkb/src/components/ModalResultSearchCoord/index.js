import React from 'react';
import style from './index.module.css';
import { idKey } from '../../utilites/idKey';
import DiseaseModalResultSearchCoord from './DiseaseModalResultSearchCoord';
import CrossDeleteId from '../img/CrossDeleteId/CrossDeleteId';

function ModalResultSearchCoord({ diseases = [], view, getData, onClickCloseModalResultSearch }) {
	return (
		<div className={style[view]}>
			{/* <div className={style.crossDeleteWrapper}>
        <div className={style.crossDeleteContainer} onClick={() => onClickCloseModalResultSearch()}>
        	<CrossDeleteId />
        </div>
      </div> */}

      {diseases.map(disease => (
        <DiseaseModalResultSearchCoord
          key={idKey()}
          disease={disease}
          getData={getData}
        />
      ))}
    </div>
  );
}

export default ModalResultSearchCoord;
