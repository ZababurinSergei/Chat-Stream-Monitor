import React from 'react';
import style from "./index.module.css";
function Index({className = {}, isOpen = false}) {
  return (
      <div className={`${style.icon_wrapper} ${className.icon_wrapper} ${isOpen ? style.isOpen : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd"
                  d="M5 4C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H5ZM2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5Z"
                  fill="#6C8BC9"/>
            <path d="M9.41421 7C8.52331 7 8.07714 8.07714 8.70711 8.70711L11.2929 11.2929C11.6834 11.6834 12.3166 11.6834 12.7071 11.2929L15.2929 8.70711C15.9229 8.07714 15.4767 7 14.5858 7H9.41421Z"
                  fill="#6E8AC7"/>
            <path d="M9.41421 13C8.52331 13 8.07714 14.0771 8.70711 14.7071L11.2929 17.2929C11.6834 17.6834 12.3166 17.6834 12.7071 17.2929L15.2929 14.7071C15.9229 14.0771 15.4767 13 14.5858 13H9.41421Z"
                  fill="#6E8AC7"/>
        </svg>
    </div>
  );
}

export default Index;
