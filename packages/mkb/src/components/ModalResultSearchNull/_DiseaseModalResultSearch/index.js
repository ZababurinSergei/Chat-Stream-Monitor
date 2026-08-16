import React, { useState } from 'react';
import style from './index.module.css';

import { useNavigate } from 'react-router-dom';
import { href } from '../../../utilites/Icd-11';
import { idKey } from '../../../utilites/idKey';

import IndexTermModalResultSearch from '../_IndexTermModalResultSearch';

function DiseaseModalResultSearch({ disease }) {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const onClickHandler = event => {
    event.preventDefault();
    navigate(`${href.decoder(disease.uri)}`);
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
        <IndexTermModalResultSearch
          key={idKey()}
          term={disease.entity.indexTerm[0]}
        />
      )}
      {disease.entity.indexTerm &&
        disease.entity.indexTerm.length > 1 &&
        isOpen &&
        disease.entity.indexTerm.map((term, i) => (
          <IndexTermModalResultSearch
            key={idKey()}
            term={term}
            i={i}
            onClickOpen={onClickOpen}
          />
        ))}
      {disease.entity.indexTerm &&
        disease.entity.indexTerm.length > 1 &&
        !isOpen && (
          <IndexTermModalResultSearch
            key={idKey()}
            term={disease.entity.indexTerm[0]}
            i={0}
            onClickOpen={onClickOpen}
          />
        )}
    </div>
  );
}

export default DiseaseModalResultSearch;
