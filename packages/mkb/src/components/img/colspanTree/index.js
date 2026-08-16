import React from 'react';
import './index.style.css';

function Index({className= {}, width = 24, height = 24}) {
    return (
        <>
            <div className={`arrow-img__wrapper ${className[`arrow-img__wrapper`]}`}>
                <svg
                    width={width}
                    height={height}
                    viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd"
                          d="M8 11C8 9.34315 9.34315 8 11 8H19C20.6569 8 22 9.34315 22 11V19C22 20.6569 20.6569 22 19 22H11C9.34315 22 8 20.6569 8 19V11ZM11 10C10.4477 10 10 10.4477 10 11V19C10 19.5523 10.4477 20 11 20H19C19.5523 20 20 19.5523 20 19V11C20 10.4477 19.5523 10 19 10H11Z"
                          fill="#6C8BC9"/>
                    <path fillRule="evenodd" clipRule="evenodd"
                          d="M1 4C1 2.34315 2.34315 1 4 1H12C13.6569 1 15 2.34315 15 4V5C15 5.55228 14.5523 6 14 6C13.4477 6 13 5.55228 13 5V4C13 3.44772 12.5523 3 12 3H4C3.44772 3 3 3.44772 3 4V12C3 12.5523 3.44772 13 4 13H5C5.55228 13 6 13.4477 6 14C6 14.5523 5.55228 15 5 15H4C2.34315 15 1 13.6569 1 12V4Z"
                          fill="#6C8BC9"/>
                </svg>
            </div>
        </>
    );
}

export default Index;
