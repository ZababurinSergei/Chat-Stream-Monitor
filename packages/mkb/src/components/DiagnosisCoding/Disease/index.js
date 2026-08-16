import React, { useCallback, useState, useEffect, useContext } from 'react';
import style from './index.module.css';

import { idKey } from '../../../utilites/idKey';

import JMarker from '../../img/JMarker';
import KMarker from '../../img/KMarker';
import EqualsMarker from '../../img/EqualsMarker';
import PlusMarker from '../../img/PlusMarker';
import ResultInsert from '../ResultInsert/index';
import analytics from '@src/utilites/analytics'
import { useLocalStorage } from '@src/hooks/useLocalStorage';
import { getUserInfo } from '@src/modules/api';
import isEmpty from "../../../utilites/isEmpty";
import { UserContext } from '@src/App';

function Disease({ ismobileleftmenu, setmobileleftmenu, diseases, codeDiseaseChoice }) {
	const [typeOpen, setTypeOpen] = useState('');
  const [insert, setInsert] = useState(false);
  const [isBlueTitle, setIsBlueTitle] = useState(diseases.entity.isBlueTitle);
  const [anonUser, setAnonUser] = useLocalStorage('__anon_id', undefined);
  const {userInfo} = useContext(UserContext);

  const closeInsert = (event, type, diseases) => {
      const user = !isEmpty(userInfo) ? userInfo.email : anonUser
      let action = window.location.pathname.startsWith('/coding') ? 'coding_view_entity_browser_window': 'coding_select_entity'
      if(type === 'details') {
          action = 'coding_select_entity'
      }

      if(type === 'plusMaby') {
          action = 'coding_select_entity'
      }

      if(type === 'kmarker') {
        action = 'coding_select_entity'
      }

      let codeData = ''
      switch (diseases.entity?.classKind?.toLowerCase()) {
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
          action: action
      })

      setTypeOpen(event.currentTarget.dataset.type);
      setInsert(!insert);
  };
  const onClickHandler = (diseases, event) => {
      let selectedCode = event.currentTarget.dataset.cod

      const user = !isEmpty(userInfo) ? userInfo.email : anonUser

      let action = ''
      switch (diseases.entity?.classKind?.toLowerCase()) {
        case "window":
        case "category":
        case "chapter":
          action = diseases.entity.code
          break
        case "block":
          action = diseases.entity.codeRange
          break
        default:
          console.error('Неизвестный тип classKind', diseases.entity)
          if(diseases.entity.code) {
            action = diseases.entity.code
          } else if(diseases.entity.codeRange) {
            action = diseases.entity.codeRange
          } else {
            console.error('Нет code и codeRange записываю title', diseases.entity)
            action = diseases.entity.title
          }
          break
      }

      analytics.page();
      analytics.identify(user, {
          userAgent: window.navigator.userAgent,
          deseaseCode: action,
          action: 'coding_click_code_entity'
      })

      navigator.clipboard.writeText(event.currentTarget.dataset.cod);
      codeDiseaseChoice(event.currentTarget.dataset.cod);
  };

  return (
    <div data-cod={diseases.entity.code} className={style.container}>
      <div className={isBlueTitle ? style.upBlockBlue : style.upBlock}>
        {/* выводится код болезни */}
        <div
          data-cod={diseases.entity.code}
          className={style.code}
          onClick={(event) => {
            onClickHandler(diseases, event)
          }}
        >
          {diseases.entity.code}
        </div>

        {/* выводится имя болезни с подкрашенным искомым словом */}
        <div
          data-cod={diseases.entity.code}
          className={style.word}
          onClick={(event) => {
            onClickHandler(diseases, event)
          }}
          dangerouslySetInnerHTML={{ __html: diseases.title }}
        ></div>

        <div className={style.link}>
          {(diseases.entity.postcoordinationScale) && (
            <>
              {diseases.entity.postcoordinationScale[0]
								.requiredPostcoordination ? (
									<div className={style.marker} typemark="ZplusNecessarily" data-type="plusmarker">
										<PlusMarker color="#FACDAC" onClick={(e)=>{closeInsert(e, 'plusmarker', diseases)}} />
									</div>
								) : (
									<div className={style.marker} typemark="plusMaby">
                		<PlusMarker color="#EAEAEA" onClick={(e)=>{closeInsert(e, 'plusMaby', diseases)}} />
									</div>
              )}
            </>
          )}

          {/* если есть отсылка к главе о материнстве */}
          {(diseases.entity.relatedEntitiesInMaternalChapter && diseases.entity.relatedEntitiesInMaternalChapter.length > 0) && (
            <div className={style.marker} onClick={(e)=>{closeInsert(e, 'jmarker', diseases)}} typemark="jmark" data-type="jmarker">
              <JMarker />
            </div>
          )}

          {/* если есть отсылка к перинатальной главе */}
          {(diseases.entity.relatedEntitiesInPerinatalChapter && diseases.entity.relatedEntitiesInPerinatalChapter.length > 0) && (
            <div className={style.marker}  onClick={(e)=>{closeInsert(e, 'kmarker', diseases)}} typemark="kmark" data-type="kmarker">
              <KMarker />
            </div>
          )}

          {/* если есть примечания */}
          {diseases.entity.codingNote['@value'] && (
            <div className={style.marker} onClick={(e)=>{closeInsert(e, 'equalsmarker', diseases)}} typemark="equals" data-type="equalsmarker">
              <EqualsMarker />
            </div>
          )}

          <div className={style.marker} typemark="details">
            <div className={style.title} onClick={(e)=>{closeInsert(e, 'details', diseases)}} data-type="details">
              Подробнее
            </div>
          </div>
        </div>
      </div>
      <div className={style.downBlock}>
        {insert && (
          <ResultInsert
						ismobileleftmenu={ismobileleftmenu}
						setmobileleftmenu={setmobileleftmenu}
                        closeInsert={(e)=>{closeInsert(e, 'ResultInsert', diseases)}}
						diseases={diseases}
						typeOpen={typeOpen}
						codeDiseaseChoice={codeDiseaseChoice}
          />
        )}
          {(!insert && diseases.entity.indexTerm && diseases.entity.indexTerm.length) ? (
            <div
              className={
                diseases.entity.indexTerm[0].label.isBlueIndexTerm ? style.iTermBlue : style.iTerm
              }
              key={idKey()}
              dangerouslySetInnerHTML={{ __html: diseases.entity.indexTerm[0].label['@value'] }}
            ></div>) : (<></>)}
      </div>
    </div>
  );
}

export default Disease;
