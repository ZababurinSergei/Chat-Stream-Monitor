import React, { useState } from 'react';
import style from './index.module.css';
import { useNavigate } from 'react-router-dom';
import { href } from '../../../utilites/Icd-11';
import { idKey } from '../../../utilites/idKey';
import IndexTermModalResultSearchCoord from '../IndexTermModalResultSearchCoord';

function DiseaseModalResultSearchCoord({ disease, getData }) {
  const [isOpen, setIsOpen] = useState(false);

  const onClickHandler = async event => {
		event.stopPropagation();
        event.preventDefault();
		await getData(disease);
	};

  const onClickOpen = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className={style.wrapper}>
			<div className={style.codeTitleContainer} onClick={onClickHandler}>
				{/* <div className={disease.isGray ?  `${style.code} ${style.gray}`: style.code}>{disease.entity.code}</div> */}
				<div className={`${style.code} ${style.gray}`}>{disease.entity.code}</div>
				<div
					// className={disease.isGray ?  `${style.word} ${style.gray}` : style.word}
					className={style.word}
					dangerouslySetInnerHTML={{ __html: disease.title }}
					></div>
      </div>
      {disease.entity.indexTerm && disease.entity.indexTerm.length === 1 && (
        <IndexTermModalResultSearchCoord
          key={idKey()}
          term={disease.entity.indexTerm[0]}
					getData={getData}
        />
      )}
      {disease.entity.indexTerm &&
        disease.entity.indexTerm.length > 1 &&
        isOpen &&
        disease.entity.indexTerm.map((term, i) => (
          <IndexTermModalResultSearchCoord
            key={idKey()}
            term={term}
            i={i}
            onClickOpen={onClickOpen}
						getData={getData}
          />
        ))}
      {disease.entity.indexTerm &&
        disease.entity.indexTerm.length > 1 &&
        !isOpen && (
          <IndexTermModalResultSearchCoord
            key={idKey()}
            term={disease.entity.indexTerm[0]}
            i={0}
            onClickOpen={onClickOpen}
						getData={getData}
          />
        )}
    </div>
  );
}

export default DiseaseModalResultSearchCoord;
