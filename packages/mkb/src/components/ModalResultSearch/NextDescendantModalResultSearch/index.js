import React, { useState } from 'react';
import style from './index.module.css';

import { useNavigate } from 'react-router-dom';
import { href } from '../../../utilites/Icd-11';
import { idKey } from '../../../utilites/idKey';
import { useDispatch } from "react-redux";
import { tocActions } from "../../../modules/Main/reducers/tableOfContent";
import IndexTermModalResultSearch from '../IndexTermModalResultSearch';


function NextDescendantModalResultSearch({ onClickCloseMainModalResultSearch, isComparison, disease, setToc, setExpand, setUpdateToc }) {
	// console.log('[(NextDescendantModalResultSearch): props]: disease=', disease)
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
          if(onClickCloseMainModalResultSearch) {
              console.log('--------------------------------------------')
              console.trace()
              onClickCloseMainModalResultSearch(disease)
          }
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

    if(!isComparison) {
        return (
            <div className={style.wrapper}>
                {disease.entity && <div onClick={onClickHandler} className={style.diseaseTitle}>
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

                </div>}
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

            </div>
        )
    } else {
        return (
            <div className={style.wrapper}>
                {disease.entity && <div onClick={onClickHandler} className={style.diseaseTitle}>
                    <div className={style.code}>{disease.entity.code}</div>
                    <div
                        className={style.word}
                        dangerouslySetInnerHTML={{ __html: disease.title }}
                    ></div>
                </div>}
            </div>
        )
    }

}

export default NextDescendantModalResultSearch;
