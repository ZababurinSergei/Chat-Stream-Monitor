import React, { useEffect, useState } from 'react';
import style from './index.module.css';
import SelectList from '../SelectList';

import { idKey } from '../../../utilites/idKey';
import { filterCategories } from '../../../config';

function WordList({ words, addWordFromWordList }) {
  const [sortType, setSortType] = useState(filterCategories.withoutFilter);
  const [sortData, setSortData] = useState([]);

  useEffect(() => {
    setSortData(words);
  }, [words]);

  const selectOption = titleChoice => {
    setSortType(titleChoice.name);
    if (titleChoice.name === filterCategories.wordsList[0].name) {
      setSortData(prev => {
        const newPrev = prev.sort((a, b) => {
          if (a[0][1] < b[0][1]) return -1;
          if (a[0][1] > b[0][1]) return 1;
          return 0;
        });
        return newPrev;
      });
    }
    if (titleChoice.name === filterCategories.wordsList[1].name) {
      setSortData(prev => {
        const newPrev = prev.sort((a, b) => {
          if (a[0][1] > b[0][1]) return -1;
          if (a[0][1] < b[0][1]) return 1;
          return 0;
        });
        return newPrev;
      });
    }
  };

  const onClickHandler = event => {
    const str = event.currentTarget.dataset.word;
    const data = str.split(',');
    addWordFromWordList(data);
  };

  return (
    <div className={style.wrapper}>
      <p className={style.infoSearch}>
        <br />
        <br />
        Связанные слова...
      </p>

      <h4>Список слов</h4>
      <SelectList
        selectOption={selectOption}
        filterCategories={filterCategories.wordsList}
      />
      <p className={style.filterTitle}>{sortType}</p>
			<div className={style.wordsWrapper}>
				{sortData.map(word => {
					return (
						<div key={idKey()} onClick={onClickHandler} data-word={word}>
							<p className={style.word} key={idKey()}>
								{word[0][1]}
							</p>
						</div>
					);
				})}
			</div>
      <p className={style.infoSearchDown}>
        Представленные предложения являются неполными
      </p>
    </div>
  );
}

export default WordList;
