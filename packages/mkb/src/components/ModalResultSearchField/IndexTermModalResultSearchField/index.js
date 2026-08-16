import React  from 'react';
import style from './index.module.css';


function IndexTermModalResultSearchField({ term }) {
	// const navigate = useNavigate();

	// const [isFoundationReference, setIsFoundationReference] = useState();

	// function changeUrlForGetLinearization(link) {
	// 	if (term.foundationReference) {

	// 		const entityId = link.match(/\d{0,15}$/);
	// 		console.log(`/v1/icd/release/11/2022-02/mms/${entityId}`);
	// 		return `/v1/icd/release/11/2022-02/mms/${entityId}`;
	// 	}
	// };
	// useEffect(() => {
	// 	if (term.foundationReference) {
	// 		setIsFoundationReference(changeUrlForGetLinearization(term.foundationReference));
	// 	}
	// }, [])

	const onClickHandler = event => {
		// console.log('[(IndexTermModalResultSearch): onClickHandler]: сработал onClick=');
		// console.log('[(): ]: =', );
		// if (isFoundationReference) {
		// 	event.stopPropagation()
		// 	navigate(`${href.decoder(isFoundationReference)}`);
		// }
  };


	// console.log('[(IndexTermModalResultSearch): props]: term.foundationReference=', term.foundationReference);
	return (
		<div
			className={style.wrapper}
			// onClick={onClickHandler}
			>
		<div
			className={style.iTerm}
			dangerouslySetInnerHTML={{ __html: term }}
		></div>
		</div>
	);
}

export default IndexTermModalResultSearchField;
