import React, { useEffect, useState } from 'react';
import { useSelector } from "react-redux";

import style from './index.module.css';
import { SecondButton } from '../Button/Button';
import CopyLineCode from '../CopyLineCode';

import store from '../../store';
import {idKey} from "../../utilites/idKey";
import analytics from '@src/utilites/analytics'
import { useLocalStorage } from '@src/hooks/useLocalStorage';
import { getUserInfo } from '@src/modules/api';
import isEmpty from "../../utilites/isEmpty";
function CopyLine({setCodingModal, codeDiseaseChoice}) {
	const [pageCode, setPageCode] = useState()
    // const [user_id, setManuallyUpdated] = useLocalStorage('__user_id', '');
    const [accessToken, setAccessToken] = useLocalStorage('accessToken', null);
    const [anonUser, setAnonUser] = useLocalStorage('__anon_id', undefined);
    const [userInfo, setUserInfo] = useState(undefined);

	store.subscribe(() => setPageCode(store.getState().icd.codes.codes.self));

    useEffect(() => {
        if (accessToken) {
            getUserInfo(accessToken)
                .then(data => {
                    setUserInfo(data.data)})
                .catch(error => {
                    console.log(error);
                })
        } else {
            setUserInfo(undefined)
        }
    }, [])

    const buttonHandler = (e, type) => {

        if(type === 'choiceCode') {
            const user = !isEmpty(userInfo) ? userInfo.email : anonUser

            let selectedCode = pageCode
            analytics.page();
            analytics.identify(user, {
                userAgent: window.navigator.userAgent,
                deseaseCode: selectedCode,
                action: 'coding_copy_postcoordination_code  '
            })
        }


        // if(user_id) {
        //     analytics.identify(userInfo ? userInfo.email : user_id, {
        //         userAgent: window.navigator.userAgent,
        //         type: 'coding',
        //         email: userInfo ? userInfo.email: '',
        //         deseaseCode: selectedCode,
        //         noDCode: false
        //     })
        // } else {
        //     analytics.identify(`user-id-${idKey()}`, {
        //         userAgent: window.navigator.userAgent,
        //         type: 'coding',
        //         email: userInfo.email ? userInfo.email: '',
        //         deseaseCode: selectedCode,
        //         noDCode: false
        //     })
        // }

			navigator.clipboard.writeText(pageCode);
			codeDiseaseChoice(pageCode)
			setCodingModal(prev => !prev)
    };

  return (
    <div className={style.wrapper}>
      <div className={style.codeContainer}>
        <CopyLineCode pageCode={pageCode} />
      </div>
      <div className={style.buttonContainer}>
        <SecondButton buttonHandler={(e) => {
            buttonHandler(e, 'choiceCode')
        }} buttonLabel="Выбрать" />
      </div>
    </div>
  );
}

export default CopyLine;
