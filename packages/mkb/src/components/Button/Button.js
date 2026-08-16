import React from 'react';
import './Button.style.css';
import {profile} from '../../config';
// import { fillOptions } from '../../modules/fillOptionsDownload';

import Download from '../img/Download/Download';
import Basket from '../img/Basket/Basket';
import loadingImg from './assets/loading.svg'

function Button({buttonHandler}) {
	
	const onclickHandler = () => {
		buttonHandler();
	};

	return (
		<div className='buttons'>
			<button onClick={onclickHandler} className="button__main">
				{profile.button}
			</button>

			<button onClick={onclickHandler} className="button__second">
				{profile.button}
			</button>

			<button onClick={onclickHandler} className="button__main-download">
				<Download />
				{profile.button}
			</button>

			<button onClick={onclickHandler} className="button__second-download">
				<Download />
				{profile.button}
			</button>
			<button onClick={onclickHandler} className="button__main-delete-img">
				<Basket />
				{profile.button}
			</button>

			<button onClick={onclickHandler} className="button__main-delete">
				{profile.button}
			</button>

			<button onClick={onclickHandler} className="button__second-delete">
				{profile.button}
			</button>


			<button onClick={onclickHandler} className="button__second-delete-img">
				<Basket />
				{profile.button}
			</button>
		</div>
	);
}

export default Button;

export const MainButton = ({buttonHandler, buttonLabel, bgColor, isDisabled, isLoading}) => {
  const onclickHandler = () => {
    buttonHandler();
  };

  return (
    <button style={{'background': bgColor}} disabled={isDisabled} onClick={onclickHandler} className="button__main flex items-center">
      {isLoading && <img src={loadingImg} className='h-full m-0' /> }
	  {buttonLabel || profile.button}
    </button>
  );
};

export const SecondButton = ({buttonHandler, buttonLabel, buttonCheckImg = true, isDisabled}) => {
	const onclickHandler = () => {
	  buttonHandler();
	};

	return (
	  <button onClick={onclickHandler} className="button__second" disabled={isDisabled}>
		{buttonCheckImg && (<div className="button__second-img">{' '}</div>)}
		{buttonLabel || profile.button}
	  </button>
	);
  };

  export const DownloadButton = ({buttonHandler, buttonLabel, isDisabled}) => {
	const onclickHandler = () => {
	  buttonHandler();
	};

	return (
	  <button onClick={onclickHandler} className="button__second-download" style={{width: 'auto', cursor: 'pointer'}} disabled={isDisabled}>
		<Download />
		{buttonLabel || profile.button}
	  </button>
	);
  };

  export const DeleteButton = ({buttonHandler, buttonLabel}) => {
	const onclickHandler = () => {
	  buttonHandler();
	};

	return (
		<button onClick={onclickHandler} className="button__main-delete">
		{buttonLabel || profile.button}
	</button>
	);
  };
