import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { href } from '../../../utilites/Icd-11';
import { idKey } from '../../../utilites/idKey';
import style from './index.module.css';

import { tocActions } from '../../../modules/Main/reducers/tableOfContent';
import IndexTermModalResultSearch from '../IndexTermModalResultSearchField';
import analytics from '@src/utilites/analytics';
import isEmpty from '../../../utilites/isEmpty';
import { UserContext } from '@src/App';
import { useLocalStorage } from '@src/hooks/useLocalStorage';

function DiseaseModalResultSearchField({
  setToc,
  setExpand,
  setUpdateToc,
  disease,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {userInfo} = useContext(UserContext);
  const [anonUser, setAnonUser] = useLocalStorage('__anon_id', undefined);
  const onClickHandler = (_event, disease) => {
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

    let request = {
      pathname: new URL(`${window.location.origin}${disease.uri}`).pathname,
      href: new URL(`${window.location.origin}${disease.uri}`).href,
    };

    navigate(`${href.decoder(disease.uri)}`);

    dispatch(
      tocActions.fetchSearch({
        pathname: request,
        type: 'window',
        cb: (error, content) => {
          if (error) {
            console.log('error', error);
            return;
          }
          setToc(content.data);
          setExpand(content.expand);
          setUpdateToc(undefined);
        },
      }),
    );
  };

  return (
		<div className={style.wrapper} onClick={(event) => onClickHandler(event, disease)}>
			<div className={style.codeWord}>
      <div className={style.code}>{disease.code}</div>

      <div
        className={style.word}
        dangerouslySetInnerHTML={{ __html: disease.title }}
				></div>
			</div>
      {disease.inscription.length > 0 &&
        disease.inscription.map(term => (
          <IndexTermModalResultSearch key={idKey()} term={term} />
        ))}
    </div>
  );
}

export default DiseaseModalResultSearchField;
