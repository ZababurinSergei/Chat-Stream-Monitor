import React from 'react';
import CrossDelete from '../../img/CrossDelete/CrossDelete';
import StyleMap from '../../img/StyleMap/StyleMap';
import style from './Modal.module.css';

function Modal({ closeModal }) {
  const onClickHandler = event => {
    event.stopPropagation();
    // console.log(event.target.getBoundingClientRect())
    closeModal();
  };

  return (
    <>
      <div className={style.modal}>
        <div className={style.header}>
          <div className={style.title}>
            <h4 className={style.textTitle}>CA20.Z Бронхит неуточненный</h4>
            <p className={style.textHeader}>Совпадающие термины</p>
          </div>
          <div className={style.close} onClick={onClickHandler}>
            <CrossDelete />
          </div>
        </div>
        <div className={style.list}>
          <p className={style.textList}>Бронхит неуточненный</p>
          <p className={style.textList}>Бронхит</p>
          <p className={style.textList}>инфекционный бронхит</p>
          <p className={style.textList}>Катаральный бронхит</p>
          <p className={style.textList}>Мембранозный бронхит</p>
          <p className={style.textList}>Ларинготрахеобронхит</p>
          <p className={style.textList}>LTB - [ларинготрахеобронхит]</p>
        </div>
        <div className={style.links}>
          <p className={style.textHeader}>
            Соответствующие рубрики в главе J о материнстве
          </p>
          <p className={style.textLink}>
            Заболевания дыхательной системы, осложняющие беременность, роды или
            послеродовой период / бронхит неуточненный
          </p>

          <p className={style.textHeader}>
            Соответствующие рубрики в перинатальной К главе{' '}
          </p>
          <p className={style.textLink}>
            Хроническое распираторное заболевание, возникающее в перинатальном
            периоде
          </p>

          <p className={style.textHeader}>Примечание по кодированию</p>
          <p className={style.textLink}>
            Исключает острый инфекционный бронхит
          </p>
        </div>
        <div className={style.hierarchy}>
          <p className={style.hierarchyLink}>Смотреть в иерархииА</p>
        </div>
        <StyleMap />
      </div>
    </>
  );
}

export default Modal;
