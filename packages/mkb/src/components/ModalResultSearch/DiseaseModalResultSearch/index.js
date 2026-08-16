import React, { useContext, useState } from 'react';
import style from './index.module.css';

import { useNavigate } from 'react-router-dom';
import { href } from '../../../utilites/Icd-11';
import { idKey } from '../../../utilites/idKey';
import { useDispatch } from 'react-redux';
import { tocActions } from '../../../modules/Main/reducers/tableOfContent';
import IndexTermModalResultSearch from '../IndexTermModalResultSearch';
import DescendantModalResultSearch from '../DescendantModalResultSearch';
import isEmpty from '../../../utilites/isEmpty';
import analytics from '@src/utilites/analytics'
import { useLocalStorage } from '@src/hooks/useLocalStorage';
import { UserContext } from '@src/App';
import NextDescendantModalResultSearch from "../NextDescendantModalResultSearch";

function DiseaseModalResultSearch({ className, disease, setToc, setExpand, setUpdateToc, onClickCloseMainModalResultSearch }) {
    if(!className) {
        className = {}
    }

    const [isOpen, setIsOpen] = useState(false);
    const [isBlueTitle, setIsBlueTitle] = useState(disease.entity.isBlueTitle);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {userInfo} = useContext(UserContext);
    const [anonUser, setAnonUser] = useLocalStorage('__anon_id', undefined);

    const isComparison =  window.location.pathname.startsWith('/comparison')
    const isAdminEditor =  window.location.pathname.endsWith('/delete-record') || window.location.pathname.endsWith('/new-record')
    const onClickHandlerDescendant = descendant => {
        onClickCloseMainModalResultSearch(descendant)
    }
    const onClickHandler = event => {
    event.preventDefault();

    if(isComparison || isAdminEditor) {
        console.log('navigate')
        onClickCloseMainModalResultSearch(disease, isAdminEditor? 'admin': 'comparison')
    } else {
        let request = {
            pathname: new URL(`${window.location.origin}${disease.uri}`).pathname,
            href: new URL(`${window.location.origin}${disease.uri}`).href
        }

        const user = !isEmpty(userInfo) ? userInfo.email : anonUser

        let action = ''
        switch (disease.entity?.classKind?.toLowerCase()) {
          case "window":
          case "category":
          case "chapter":
            action = disease.entity.code
            break
          case "block":
            action = disease.entity.codeRange
            break
          default:
            console.error('Неизвестный тип classKind', disease.entity)
            if(disease.entity.code) {
              action = disease.entity.code
            } else if(disease.entity.codeRange) {
              action = disease.entity.codeRange
            } else {
              console.error('Нет code и codeRange записываю title', disease.entity)
              action = disease.entity.title
            }
            break
        }

        analytics.page();
        analytics.identify(user, {
            userAgent: window.navigator.userAgent,
            deseaseCode: action,
            action: 'select_entity_from_search_results'
        })

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
    }
  };

  const onClickOpen = () => {
    setIsOpen(prev => !prev);
  };

	if (!isComparison && disease.descendants) {
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
				<DescendantModalResultSearch
					setToc={setToc}
					setExpand={setExpand}
					setUpdateToc={setUpdateToc}
					key={idKey()}
					disease={descendant}
                    onClickCloseMainModalResultSearch={onClickCloseMainModalResultSearch}
				/>
			)}
			</div>)
    }

    if (isComparison && disease.descendants) {
        return (
            <div className={`${style.wrapper} ${className.rootWrapper}`}>
                {disease.entity.code ? (
                          <div onClick={ () => {
                              onClickHandlerDescendant(disease)
                          }} className={`${style.diseaseTitle} ${className.diseaseTitleFirst}`}>
                            <div className={style.code}>{disease.entity.code}</div>
                            <div
                                className={style.word}
                                dangerouslySetInnerHTML={{ __html: disease.title }}
                            ></div>
                          </div>
                ): ('')}

                {isComparison && disease.descendants.map(descendant => {
                    if (descendant.descendants) {
                        return (
                            <div  key={idKey()} className={`${style.wrapper} ${className.diseaseWrapper}`}>
                                {descendant.entity.code &&
                                    <div onClick={() => {
                                        
                                        onClickHandlerDescendant(descendant)
                                    }} className={`${style.diseaseTitle} ${className.diseaseTitle}`}>
                                        <div className={style.code}>{descendant.entity.code}</div>
                                        <div
                                            className={style.word}
                                            dangerouslySetInnerHTML={{__html: descendant.title}}
                                        ></div>
                                    </div>}


                                {descendant.descendants.map(descendant => {
                                    return (
                                        <div key={idKey()} className={`${style.wrapper} ${className.diseaseWrapperChild}`}>
                                            {descendant.entity && <div onClick={ () => {
                                               
                                                onClickHandlerDescendant(descendant)
                                            }} className={style.diseaseTitle}>
                                                <div className={style.code}>{descendant.entity.code}</div>
                                                <div
                                                    className={style.word}
                                                    dangerouslySetInnerHTML={{ __html: descendant.title }}
                                                ></div>
                                            </div>}
                                        </div>
                                    )

                                })}
                            </div>)}
                })}
            </div>)
    }

    if(isComparison && disease.entity.code) {
        return (
            <div className={`${style.wrapper} ${className.rootWrapper}`}>
                <div onClick={(e) => {
                    onClickHandler(e)
                }} className={isBlueTitle ? style.diseaseTitleBlue : style.diseaseTitle}>
                    <div className={style.code}>{disease.entity.code}</div>
                    <div
                        className={style.word}
                        dangerouslySetInnerHTML={{ __html: disease.title }}
                    ></div>
                </div>
            </div>
        );
    }

    if(!isComparison) {
        return (
            <div className={style.wrapper}>
                <div onClick={(e) => {
                    onClickHandler(e)
                }} className={isBlueTitle ? style.diseaseTitleBlue : style.diseaseTitle}>
                    <div className={style.code}>{disease.entity.code}</div>
                    <div
                        className={style.word}
                        dangerouslySetInnerHTML={{ __html: disease.title }}
                    ></div>
                </div>
                {disease.entity.indexTerm && disease.entity.indexTerm.length === 1 && (
                    <IndexTermModalResultSearch
                        setToc={setToc}
                        setExpand={setExpand}
                        setUpdateToc={setUpdateToc}
                        key={idKey()}
                        term={disease.entity.indexTerm[0]}
                        disease={disease}
                        onClickCloseMainModalResultSearch={onClickCloseMainModalResultSearch}
                    />
                )}
                {disease.entity.indexTerm &&
                    disease.entity.indexTerm.length > 1 &&
                    isOpen &&
                    disease.entity.indexTerm.map((term, i) => (
                        <IndexTermModalResultSearch
                            setToc={setToc}
                            setExpand={setExpand}
                            setUpdateToc={setUpdateToc}
                            key={idKey()}
                            term={term}
                            i={i}
                            onClickOpen={onClickOpen}
                            disease={disease}
                            onClickCloseMainModalResultSearch={onClickCloseMainModalResultSearch}
                        />
                    ))}
                {disease.entity.indexTerm &&
                    disease.entity.indexTerm.length > 1 &&
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
                            onClickCloseMainModalResultSearch={onClickCloseMainModalResultSearch}
                        />
                    )}
            </div>
        );
    }

}

export default DiseaseModalResultSearch;
