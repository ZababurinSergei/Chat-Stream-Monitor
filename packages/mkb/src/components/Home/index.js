import React from 'react';

export const Home = () => {
  return (
    <div className='footer__wrapper'>
      <div className='footer__container'>
        <p className='footer__text'>Единая государственная система в сфере здравоохранения (ЕГИСЗ)</p>
        <p className='footer__text'>&copy; {new Date().getFullYear()}Министерство здравоохранения РФ</p>
      </div>
      <div className='footer__container'>
        <p className='footer__text'>Служба поддержки: 8-800-500-74-78</p>
        <p className='footer__text'>Обращение в тех. поддержку: <span className='footer__email_blue'>egisz@stp-egisz.ru</span></p>
      </div>
    </div>
  );
}
