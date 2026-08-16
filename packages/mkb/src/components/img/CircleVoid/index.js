import React from 'react';
import style from './index.module.css';

function CircleVoid({ fill }) {
  return (
    <div className={style.circleVoid}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="#fff"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="10" r="9.5" fill={fill} stroke="#333333" />
      </svg>
    </div>
  );
}

export default CircleVoid;
