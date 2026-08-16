import React from 'react';
import { Header } from './Header'
import { Footer } from './Footer'
import style from './index.module.css'

export const Body = ({ type, className = {}, ismobileleftmenu, setmobileleftmenu, children }) => {

    return (
        <>
            {type !== 'window' &&
                <Header
                    className={style}
                    ismobileleftmenu={ismobileleftmenu}
                    setmobileleftmenu={setmobileleftmenu}
                />}
            <div className={`${className.result_insert__body_main} ${style.main}`}>
                {children}
            </div>
            { type !== 'window' && <Footer /> }
        </>
    )
};

