import React, { Suspense, useContext, useEffect, useState } from 'react';
import CrossDelete from '../../img/CrossDelete/CrossDelete';
import style from './index.module.css';

import { useNavigate } from 'react-router-dom';
import { Main } from '../../../modules/Main/components/Main';
import { idKey } from '../../../utilites/idKey';
import { Body } from '../../Body';
import Close from '../../img/Close';
import EqualsMarker from '../../img/EqualsMarker/index';
import JMarker from '../../img/JMarker/index';
import KMarker from '../../img/KMarker/index';
import StyleMap from '../../img/StyleMap/StyleMap';
import { ModalWindow } from '../../modal';
import TermsMatching from '../TermsMatching';
import { UserContext } from '@src/App';
import { useLocalStorage } from '@src/hooks/useLocalStorage';
import analytics from '@src/utilites/analytics'
import isEmpty from '../../../utilites/isEmpty';

function ResultInsert({
  ismobileleftmenu,
  setmobileleftmenu,
  closeInsert,
  diseases,
	typeOpen,
	codeDiseaseChoice,
}) {
  const navigate = useNavigate();
  const [isModal, setModal] = useState(false);
  const [stringCodeAndTitle, _useStringCodeAndTitle] = useState(
    `${diseases.entity.code} ${diseases.title}`,
  );
  const [isMoreFive, setIsMoreFive] = useState(false);
  const [uriForMain, setUriForMain] = useState(diseases.uri);
  const [idForMain, setIdForMain] = useState(diseases.id);
  const {userInfo} = useContext(UserContext);
  const [anonUser, setAnonUser] = useLocalStorage('__anon_id', undefined);

  useEffect(() => {
    if (diseases.entity.indexTerm?.length >= 5) {
      setIsMoreFive(true);
    }
  }, []);

  const onClickHandler = () => {
    closeInsert();
  };

  const openListindexTerm = () => {
    console.log('нажата openListindexTerm');
    setIsMoreFive(prev => !prev);
  };

  const onClickTerm = uri => {
    setModal(true);
  };

  const onClickChapter = (uri, id, diseases, type) => {
    if(window.location.pathname.startsWith('/coding')) {
      const user = !isEmpty(userInfo) ? userInfo.email : anonUser

      let action = 'coding_view_entity_browser_window'

      if( type === 'StyleMap') {
        action = 'coding_view_entity_browser_window'
      }

        let codeData = ''
        switch (diseases?.entity?.classKind?.toLowerCase()) {
          case "window":
          case "category":
          case "chapter":
            codeData = diseases.entity.code
            break
          case "block":
            codeData = diseases.entity.codeRange
            break
          default:
            console.error('Неизвестный тип classKind', diseases.entity)
            if(diseases.entity.code) {
              codeData = diseases.entity.code
            } else if(diseases.entity.codeRange) {
              codeData = diseases.entity.codeRange
            } else {
              console.error('Нет code и codeRange записываю title', diseases.entity)
              codeData = diseases.entity.title
            }
            break
        }

        analytics.page();
        analytics.identify(user, {
          userAgent: window.navigator.userAgent,
          deseaseCode: codeData,
          action: 'coding_view_entity_browser_window'
        })
    }

    setUriForMain(uri);
    setIdForMain(id);
    setModal(true);
  };

  return (
    <div className={style.wrapper}>
      {isModal ? (
        <ModalWindow
          type={'window'}
          className={style}
          setModal={setModal}
          isModal={isModal}
        >
          <Body
            className={style}
            type={'window'}
            isModal={true}
            ismobileleftmenu={ismobileleftmenu}
            setmobileleftmenu={setmobileleftmenu}
          >
            <Close
              className={style.icon_coding}
              onClick={() => {
                setModal(false);
                navigate(`${process.env.PUBLIC_URL}/coding`);
              }}
            />
            <Suspense fallback={<p>Загрузка...</p>}>
              <Main
                className={style}
                type={'window'}
                isModal={true}
                setCodingModal={setModal}
                uri={uriForMain}
                id={idForMain}
                ismobileleftmenu={ismobileleftmenu}
                setmobileleftmenu={setmobileleftmenu}
								isCodingPage={true}
								codeDiseaseChoice={codeDiseaseChoice}
              />
            </Suspense>
          </Body>
        </ModalWindow>
      ) : (
        ''
      )}
      <div className={style.header}>
        <div className={style.title}>
          <h4
            className={style.textTitle}
            dangerouslySetInnerHTML={{ __html: stringCodeAndTitle }}
          ></h4>
          {diseases.entity.indexTerm && (
            <p className={style.textHeader}>Совпадающие термины</p>
          )}
        </div>
        <div className={style.close} onClick={onClickHandler}>
          <CrossDelete />
        </div>
      </div>

      {diseases.entity.indexTerm && (
        <div className={style.list}>
          {diseases.entity.indexTerm.map((term, i, array) => {
            if (array.length >= 5 && isMoreFive) {
              if (i < 5) {
                return (
                  <TermsMatching
                    onClickTerm={onClickTerm}
                    key={idKey()}
                    term={term}
                    postcoordinationScale={
                      diseases.entity.postcoordinationScale
                    }
                    disease={diseases}
                  />
                );
              }
              if (i === 5) {
                return (
                  <p
                    className={style.infoSearchText}
                    key={idKey()}
                    onClick={openListindexTerm}
                  >
                    Показать все {array.length}
                  </p>
                );
              }
            } else if (array.length >= 5 && !isMoreFive) {
              if (i < array.length - 1) {
                return (
                  <TermsMatching
                    key={idKey()}
                    onClickTerm={onClickTerm}
                    term={term}
                    postcoordinationScale={
                      diseases.entity.postcoordinationScale
                    }
                    disease={diseases}
                  />
                );
              }
              if (i === array.length - 1) {
                return (
                  <React.Fragment key={idKey()}>
                    <TermsMatching
                      // key={idKey()}
                      onClickTerm={onClickTerm}
                      term={term}
                      postcoordinationScale={
                        diseases.entity.postcoordinationScale
                      }
                      disease={diseases}
                    />
                    <p
                      className={style.infoSearchText}
                      onClick={openListindexTerm}
                      // key={idKey()}
                    >
                      Показать первые 5
                    </p>
                  </React.Fragment>
                );
              }
            } else if (array.length < 5) {
              return (
                <TermsMatching
                  key={idKey()}
                  onClickTerm={onClickTerm}
                  term={term}
                  postcoordinationScale={diseases.entity.postcoordinationScale}
                  disease={diseases}
                />
              );
            }
          })}
        </div>
      )}

      <div className={style.links}>
        {diseases.entity.fullySpecifiedName['@value'] && (
          <>
            <p className={style.textHeader}>Полное имя</p>
            <p className={style.textLink}>
              {diseases.entity.fullySpecifiedName['@value']}
            </p>
          </>
        )}

        {diseases.entity.longDefinition['@value'] && (
          <>
            <p className={style.textHeader}>Дополнительная информация</p>
            <p className={style.textLink}>
              {diseases.entity.longDefinition['@value']}
            </p>
          </>
        )}

        {diseases.entity.definition['@value'] && (
          <>
            <p className={style.textHeader}>Описание</p>
            <p className={style.textLink}>
              {diseases.entity.definition['@value']}
            </p>
          </>
        )}

        {diseases.entity.inclusion && (
          <>
            <p className={style.textHeader}>Включая</p>

            {diseases.entity.inclusion.map(inclusion => (
              <p className={style.textLink} key={idKey()}>
                {'-'} {inclusion.label['@value']}
              </p>
            ))}
          </>
        )}

        {diseases.entity.exclusion && (
          <>
            <p className={style.textHeader}>Исключая</p>

            {diseases.entity.exclusion.map(exclusion => (
              <p className={style.textLink} key={idKey()}>
                {'-'} {exclusion.label['@value']}
              </p>
            ))}
          </>
        )}

        {diseases.entity.relatedEntitiesInPerinatalChapter && (
          <React.Fragment>
            <div className={style.inclusionHeader}>
              <div className={style.inclusionTitle}>
                <p
                  className={
                    typeOpen === 'kmarker'
                      ? `${style.textHeader} ${style.textHeaderYellow}`
                      : style.textHeader
                  }
                >
                  Соответствующие рубрики в перинатальной К главе{' '}
                </p>
              </div>
              <div className={style.inclusionMarker}>
                <KMarker />
              </div>
            </div>
            {diseases.entity.relatedEntitiesInPerinatalChapter.map(related => {
              if (related.code) {
                return (
                  <p key={idKey()} className={style.textLink}>
                    {related.title['@value'] + ' '}(
                    <span
                      onClick={() => onClickChapter(related.uri, undefined, diseases, 'PerinatalChapter')}
                      className={style.codeLink}
                    >
                      {related.code}
                    </span>
                    )
                  </p>
                );
              }
              return (
                <p key={idKey()} className={style.textLink}>
                  {related.title['@value']}
                </p>
              );
            })}
          </React.Fragment>
        )}
        {diseases.entity.relatedEntitiesInMaternalChapter && (
          <React.Fragment>
            <div className={style.inclusionHeader}>
              <div className={style.inclusionTitle}>
                <p
                  className={
                    typeOpen === 'jmarker'
                      ? `${style.textHeader} ${style.textHeaderYellow}`
                      : style.textHeader
                  }
                >
                  Соответствующие рубрики в главе J о материнстве{' '}
                </p>
              </div>
              <div className={style.inclusionMarker}>
                <JMarker />
              </div>
            </div>
            {diseases.entity.relatedEntitiesInMaternalChapter.map(related => {
              if (related.code) {
                return (
                  <p className={style.textLink} key={idKey()}>
                    {related.title['@value'] + ' '}(
                    <span
                      onClick={() => onClickChapter(related.uri, undefined, diseases, 'MaternalChapter')}
                      className={style.codeLink}
                    >
                      {related.code}
                    </span>
                    )
                  </p>
                );
              }
              return (
                <p className={style.textLink} key={idKey()}>
                  {related.title['@value']}
                </p>
              );
            })}
          </React.Fragment>
        )}
        {diseases.entity.codingNote['@value'] && (
          <>
            <div className={style.inclusionHeader}>
              <div className={style.inclusionTitle}>
                <p
                  className={
                    typeOpen === 'equalsmarker'
                      ? `${style.textHeader} ${style.textHeaderYellow}`
                      : style.textHeader
                  }
                >
                  Примечание по кодированию
                </p>
              </div>
              <div className={style.inclusionMarker}>
                <EqualsMarker />
              </div>
            </div>
            <p className={style.textLink}>
              {diseases.entity.codingNote['@value']}
            </p>
          </>
        )}
      </div>
      <div className={style.hierarchy}>
        <p className={style.hierarchyLink}>Смотреть в иерархии</p>
        <div className={style.styleMap}>
          <StyleMap
            onClick={() => {
              onClickChapter(diseases.uri, diseases.id, diseases, 'StyleMap');
            }}
            className={style}
          />
        </div>
      </div>
    </div>
  );
}

export default ResultInsert;
