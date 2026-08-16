import style from './index.module.css'
import StyleMap from '../../../img/StyleMap/StyleMap';

export default () => {

    return (
        <div className={style.body}>
            <div className={style.item}>
                <div className={style.content}>
                    <p className={style.paragraph}>
                     Расширенный поиск позволяет выполнять поиск по выбранным свойствам классификации. Вы можете выполнять поиск по всем свойствам или только по выбранному подмножеству
                    </p>
                </div>
            </div>
        </div>)
}