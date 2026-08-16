import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import style from './index.module.css';
import InputSearchCoord from '../InputSearchCoord';
import ModalResultSearchCoord from '../ModalResultSearchCoord';
import CrossDeleteId from '../../components/img/CrossDeleteId/CrossDeleteId';
import { search } from '../../utilites/search';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { Rnd } from '../../components/react-draggable';
import { globalCoordActions } from '../../modules/Main/reducers/globalCoord';
import * as link from '../../utilites/search/links';
import { inputSearchCoordActions } from '../../modules/Main/reducers/inputSearchCoord';
import ModalResultSearchNull from '../ModalResultSearchNull';
import { fetchList } from '../../modules/Main/api/tableOfContent';
// import { searchActions } from '../../modules/Main/reducers/search';

const InputSearchWrapper = memo(({ className, axis, onSetCode }) => {
  const dispatch = useDispatch();
  const rndRef = useRef(null);
  const store = useStore();
  const [infoResult, setInfoResult] = useState();
  const [isResult, setIsResult] = useState(false);
	const [isNotResult, setIsNotResult] = useState(false);
	const [axisScaleEntity, setAxisScaleEntity] = useState(axis.scaleEntity);
	const [grayNotes, setGrayNotes] = useState();

	useEffect(() => {
		let grayArrayChild = [];
		if (axis.scaleEntity && axis.scaleEntity.length > 0) {
			axis.scaleEntity.map(entityScale => {
				if (entityScale.child && entityScale.child.length > 0) {
					entityScale.child.map(baby => {
						if (baby.isFoundationChildElsewhere) {
							grayArrayChild.push(baby);
						}
					});
				}
				if (entityScale.hasOwnProperty('descendant')) {
					const uris = { uris: entityScale.descendant };
					if(uris) {
						fetchList(uris)
							.then(descendants => {
								entityScale.entityDescendant = descendants;
								let grayArray = [];
								if (entityScale.entityDescendant && entityScale.entityDescendant.length > 0) {
									entityScale.entityDescendant.map(descendant => {
										if (descendant.foundationChildElsewhere && descendant.foundationChildElsewhere.length > 0) {
											descendant.foundationChildElsewhere.map(foundationChildElsewhere => {
												foundationChildElsewhere.id = foundationChildElsewhere.linearizationReference;
												grayArray.push(foundationChildElsewhere);
											});
										}
									});
								}
								setGrayNotes(prev => {
									if (Array.isArray(prev)) {
										return [...prev, ...grayArray];
									}
									return grayArray;
								});
							})
							.catch(err => console.log(err))
					}
				}
			});
		}
		setGrayNotes(prev => {
			if (Array.isArray(prev)) {
				return [...prev, ...grayArrayChild];
			}
			return grayArrayChild;
		});
	}, []);

  useEffect(() => {
    const handleClickOutside = event => {
      event.stopPropagation();
      if (
        event.target.id === 'pathCrossDeleteId' ||
        event.target.id === 'svgCrossDeleteId'
      ) {
        setInfoResult([]);
        setIsResult(false);
        dispatch(inputSearchCoordActions.deleteResultSearch());
        globalCoordActions.setCoorination({
          x: -200,
          y: -400,
          width: 430,
          height: 350,
        });
			}
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isResult]);

  async function getData(value) {
    const newAncestor = changeUrl(value.entity.ancestor);
    const element = {
      ancestor: newAncestor,
      title: value.entity.title['@value'],
      code: value.entity.code,
      classKind: value.entity.classKind,
      codeRange: undefined,
      postcoordinationScale: undefined,
      id: `${link.URL_LOCALHOST_STANDART}${value.uri}`,
    };

    await onSetCode(axis, element);
  }

  function changeUrl(arrayUrl) {
    return arrayUrl.map(url =>
      url.replace(link.URL_PREF_BASE, link.URL_LOCALHOST_STANDART_V1),
    );
  }

	const inputValue = useCallback(async (value, scale = [], scaleGray = []) => {
		if (value.length > 2) {
			try {
				let response = [];
				let responseWord = [];
				if (scale.length > 0) {
					responseWord = await search.getResultCoord(value, scale);
				}
				let responseWordGray = [];
				if (scaleGray.length > 0) {
					responseWordGray = await search.getResultCoord(value, scaleGray);
				}
				if (responseWordGray && responseWordGray.length > 0) {
					responseWordGray.map(obj => {
						obj.isGray = true;
					});
				}


				let responseWordAll = [...responseWord, ...responseWordGray];

				for (let i = 0; i < responseWordAll.length; i++) {
					responseWordAll[i].isUnic = true;
					if (i === responseWordAll.length - 1) {
						break;
					}
					for (let j = i + 1; j < responseWordAll.length; j++) {
						if (responseWordAll[i].code === responseWordAll[j].code) {
							responseWordAll[i].isUnic = false;
							break;
						}
					}
				}
				responseWordAll = responseWordAll.filter(el => el.isUnic);

				if (scale.length === 0) {
					responseWordAll = responseWordAll.filter(el => el.isGray === true)
				}

				let responseCode = [];
				let responseCodeGray = [];
				let responseCodeAll = [];
				if (value.length < 8) {
					if (scale.length > 0) {
						responseCode = await search.api.apiSearchCodeCoord(value, scale);
					}
					if (scaleGray.length > 0) {
						responseCodeGray = await search.api.apiSearchCodeCoord(value, scaleGray);
					}
					if (responseCodeGray && responseCodeGray.length > 0) {
						responseCodeGray.map(obj => {
							if (obj.entity.code[0].toLowerCase() !== 'x') {}
							obj.isGray = true;
						});
					}
					responseCodeAll = [...responseCode, ...responseCodeGray];
					if (
						responseCodeAll.length > 0
						&& responseCodeAll[0].entity.code.toLowerCase() === value.toLowerCase()
					) {
							response = responseCodeAll;
						}
					// response = responseCodeAll;
				}
				if (responseWordAll.length > 0) response = responseWordAll;
				if (response && response.length > 0) {
						setInfoResult(response);
					setIsResult(true);
					setIsNotResult(false);
					// dispatch(searchActions.setResultSearch({response, isResponse: true, wordForResponse: value}));
				} else {
						setInfoResult(["Поиск не дал результатов"]);
						setIsResult(false);
						setIsNotResult(true);
						// dispatch(searchActions.deleteResultSearch({wordForResponse: value}));
					// }
				}
			} catch (err) {
				console.log(err);
			}
		} else {
			setInfoResult([]);
			setIsResult(false);
			setIsNotResult(false);
		}
	}, []);

  const onClickCloseModalResultSearch = useCallback(() => {
    // setInfoResult([]);
    setIsResult(false);
  // dispatch(searchActions.deleteResultSearch({wordForResponse: ''}));
  }, []);

  return (
    <div className={style.wrapper}>
      <InputSearchCoord
        className={className}
        typeInputSearch="input-search"
        // scaleEntity={notGrayNotes}
        scaleEntity={axisScaleEntity}
        scaleEntityGrayNotes={grayNotes}
        inputValue={inputValue}
        axisName={axis.axisName}
      />

			{isResult && (
				// To enable a movable modal window, you need to uncomment Rnd
        // <Rnd
        //   ref={rndRef}
        //   style={{
        //     position: 'absolute',
        //     display: 'flex',
        //     alignItems: 'center',
        //     justifyContent: 'center',
        //     top: 0,
        //     left: 0,
        //   }}
        //   default={store.getState().icd.globalCoord.coordination.tree}
        //   bounds="body"
        //   scale={1}
        //   onDrag={(event, ui) => {
        //     dispatch(
        //       globalCoordActions.setCoorination({
        //         x: ui.lastX,
        //         y: ui.lastY,
        //         width: 430,
        //         height: 350,
        //       }),
        //     );
        //   }}
        // >
          <div className={style.modalWrapper}>
            {/* <div className={style.modalWrapperHeader}>
              <div className={style.modalText}>
                {`Результаты поиска ${axis.axisName}`}
              </div>
              <div className={style.crossDeleteWrapper}>
                <div className={style.crossDeleteContainer}>
                  <CrossDeleteId />
                </div>
              </div>
            </div> */}
            <ModalResultSearchCoord
              view="postcoordinationWrapper"
              diseases={infoResult}
              getData={getData}
							axisName={axis.axisName}
							onClickCloseModalResultSearch={onClickCloseModalResultSearch}
            />
          </div>
        // </Rnd>
			)}

			{isNotResult && (
				<div className={style.modalResultSearchNullWrapper}>
					<ModalResultSearchNull/>
				</div>
			)}
    </div>
  );
});

export default InputSearchWrapper;
