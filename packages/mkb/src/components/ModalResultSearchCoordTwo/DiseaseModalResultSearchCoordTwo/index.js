import React, { useState } from 'react';
import style from './index.module.css';
import { idKey } from '../../../utilites/idKey';
import IndexTermModalResultSearchCoordTwo from '../IndexTermModalResultSearchCoordTwo';

function DiseaseModalResultSearchCoordTwo({ disease, getData }) {
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
      <div onClick={onClickHandler}>
        <div className={style.code}>{disease.entity.code}</div>
        <div
          className={style.word}
          dangerouslySetInnerHTML={{ __html: disease.title }}
        ></div>
      </div>
      {disease.entity.indexTerm && disease.entity.indexTerm.length === 1 && (
        <IndexTermModalResultSearchCoordTwo
          key={idKey()}
          term={disease.entity.indexTerm[0]}
					getData={getData}
        />
      )}
      {disease.entity.indexTerm &&
        disease.entity.indexTerm.length > 1 &&
        isOpen &&
        disease.entity.indexTerm.map((term, i) => (
          <IndexTermModalResultSearchCoordTwo
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
          <IndexTermModalResultSearchCoordTwo
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

export default DiseaseModalResultSearchCoordTwo;
