import React, { useState, memo } from 'react';
import style from './index.module.css';

import SelectList from '../SelectList';
import Disease from '../Disease';

import { idKey } from '../../../utilites/idKey';
import { filterCategories } from '../../../config';

const ResultSearch = memo(
  ({ ismobileleftmenu, setmobileleftmenu, diseases = [], codeDiseaseChoice, isCloseFilter }) => {
    const [sortType, setSortType] = useState(filterCategories.withoutFilter);

    const selectOption = titleChoice => {
      console.log(titleChoice);
      // setSortType(titleChoice);

      // if (titleChoice === filterCategories.wordsList.alphabet) {
      //   console.log(titleChoice);
      // }

      // if (titleChoice === filterCategories.wordsList.reversAlphabet) {
      //   console.log(titleChoice);
      // }
    };

    return (
      <div className={style.wrapper}>
        <div className={style.infoSearch}>
          {diseases.length > 60 && (
            <p className={style.infoSearchText}>
              Отображены не все результаты поиска. Вы можете уточнить поисковой
              запрос.
            </p>
          )}
        </div>
        <h4>Результат поиска</h4>
        <SelectList
          selectOption={selectOption}
          filterCategories={filterCategories.resultSearch}
        />
        <p className={style.filterTitle}>{sortType}</p>
				<div
					className={
						isCloseFilter
							? `${style.dis} ${style.closeFilter}`
							: `${style.dis}`
					}
				>

          {diseases.length !== 0 ? (
            diseases.map((diseases, i) => {
              	return (
									<Disease
										key={idKey()}
										diseases={diseases}
										codeDiseaseChoice={codeDiseaseChoice}
										ismobileleftmenu={ismobileleftmenu}
										setmobileleftmenu={setmobileleftmenu}
                	/>
              	);
            	})
          	) : (
            <p>Поиск не дал никаких результатов</p>
          )}
        </div>
      </div>
    );
  },
);

export default ResultSearch;
