import React, {useContext, useEffect, useState} from 'react';
import analytics from '@src/utilites/analytics'
import style from './index.module.css';
import { UserContext } from '@src/App';
import PlusMarker from '../../img/PlusMarker'
import isEmpty from "../../../utilites/isEmpty";
import { useLocalStorage } from '@src/hooks/useLocalStorage';

function TermsMatching({ onClickTerm, term, postcoordinationScale, disease }) {
	const [stringTerm, useStringTerm] = useState(term.label['@value']);
	const [anonUser, setAnonUser] = useLocalStorage('__anon_id', undefined);
	const {userInfo} = useContext(UserContext);
	const analitics = (diseases) => {
		const user = !isEmpty(userInfo) ? userInfo.email : anonUser

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
			action: 'coding_view_entity_browser_window'
		})
	}

	return (
		<div className={style.termsMatching}>
			<p
				className={style.textList}
				dangerouslySetInnerHTML={{__html: stringTerm}}
			></p>
			{postcoordinationScale &&
				<PlusMarker
					className={style}
					onClick={() => {
						analitics(disease)
						onClickTerm(disease.uri)
					}}
				/>}
		</div>
	);
}

export default TermsMatching;
