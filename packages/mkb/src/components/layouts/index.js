import React from 'react';
import Header from './Header'
import Footer from './Footer'
import style from './index.module.css'

export const Layout = ({children}) => (
  <>
    <Header />
     <div className={style.main}>
        {children}
     </div>
    <Footer />
  </>
);

