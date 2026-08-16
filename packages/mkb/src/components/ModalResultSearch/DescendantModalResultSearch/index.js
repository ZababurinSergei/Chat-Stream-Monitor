import React, { useState } from 'react';
import style from './index.module.css';

import { useNavigate } from 'react-router-dom';
import { href } from '../../../utilites/Icd-11';
import { idKey } from '../../../utilites/idKey';
import { useDispatch } from "react-redux";
import { tocActions } from "../../../modules/Main/reducers/tableOfContent";

import NextDescendantModalResultSearch from '../NextDescendantModalResultSearch';
import IndexTermModalResultSearch from '../IndexTermModalResultSearch';


function DescendantModalResultSearch({ onClickCloseMainModalResultSearch, setText, disease, setToc, setExpand, setUpdateToc, isComparison }) {
	// console.log('[(DescendantModalResultSearch): props]: disease=', disease)

    if(!setText) {
        setText = false
    }

    if(!isComparison) {
       isComparison = false
    }

  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onClickHandler = event => {
    event.preventDefault();
      const isAdminEditor =  window.location.pathname.endsWith('/delete-record') || window.location.pathname.endsWith('/new-record')
      if(!isAdminEditor) {
          let request = {
              pathname: new URL(`${window.location.origin}${disease.uri}`).pathname,
              href: new URL(`${window.location.origin}${disease.uri}`).href
          }

          navigate(href.decoder(disease.uri, window.location.pathname === '/coding' ? 'coding': 'page'))
          dispatch(
              tocActions.fetchSearch({
                  pathname: request,
                  type: 'window',
                  cb: (error, content) => {
                      if (error) {
                          console.log('error', error)
                          return;
                      }
                      setToc(content.data)
                      setExpand(content.expand)
                      setUpdateToc(undefined)
                  }
              })
          );
      } else {
          onClickCloseMainModalResultSearch(disease)
      }
  };

	const onClickHandlerIcon = event => {
		event.preventDefault();
		event.stopPropagation();
		// onClickOpen();
		setIsOpen(prev => !prev);
	}

  // const onClickOpen = () => {
	// 	setIsOpen(prev => !prev);
  // };

	if (disease.descendants) {
		return (
			<div className={style.wrapper}>
      <div onClick={onClickHandler} className={style.diseaseTitle}>
        <div className={style.code}>{disease.entity.code}</div>
        <div
          className={style.word}
          dangerouslySetInnerHTML={{ __html: disease.title }}
        ></div>
      </div>

		{disease.descendants.map(descendant =>
				<NextDescendantModalResultSearch
                    isComparison={isComparison}
					setToc={setToc}
					setExpand={setExpand}
					setUpdateToc={setUpdateToc}
					key={idKey()}
					disease={descendant}
                    onClickCloseMainModalResultSearch={onClickCloseMainModalResultSearch}
				/>
			)}
			</div>)}


  return (
		<div className={style.wrapper}>
		<div onClick={onClickHandler} className={style.diseaseTitle}>
			<div className={style.code}>{disease.entity.code}</div>
			<div
				className={style.word}
				dangerouslySetInnerHTML={{ __html: disease.title }}
			></div>
			{disease.entity.indexTerm &&
				<div className={style.icon} onClick={onClickHandlerIcon}>
					▤
				</div>
			}
		</div>
      {isOpen &&
        disease.entity.indexTerm.map((term, i) => (
          <IndexTermModalResultSearch
            setToc={setToc}
            setExpand={setExpand}
            setUpdateToc={setUpdateToc}
            key={idKey()}
            term={term}
            i={i}
            // onClickOpen={onClickOpen}
            disease={disease}
						isDescendant
          />
        ))}
      {/* {disease.entity.indexTerm &&
        !isOpen && (
          <IndexTermModalResultSearch
            setToc={setToc}
            setExpand={setExpand}
            setUpdateToc={setUpdateToc}
            key={idKey()}
            term={disease.entity.indexTerm[0]}
            i={0}
            onClickOpen={onClickOpen}
            disease={disease}
          />
        )} */}

				</div>

  )
}

export default DescendantModalResultSearch;
