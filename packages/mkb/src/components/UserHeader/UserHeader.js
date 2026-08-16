import React, {useState, useEffect} from 'react';
import './UserHeader.style.css';
import Bell from '../img/Bell/Bell';
import Person from '../img/Person/Person';
import Arrow from '../img/Arrow/Arrow';
import ProfileMenu from '../ProfileMenu/ProfileMenu';
import {profile, fillOptions} from '../../config';
import { isMobile } from 'react-device-detect';
import { useLocalStorage } from '@src/hooks/useLocalStorage';

function UserHeader({ className, userName, reset }) {
	const [activeClass, setActiveClass] = useState(false);
	className = className ? className : {}

	const onClickHandler = () => {
		setActiveClass(!activeClass);
	};

	return (
		<>
			{activeClass && (
				<div className={`close-wrapper ${className['close-wrapper']}`} onClick={onClickHandler}></div>
			)}

			<div className={`user-header ${className['user-header']}`}>
				{!isMobile &&
					<div className={`user-header__bell ${className['user-header__bell']}`}>
						<Bell
							className={className}
						/>
					</div>
				}
				<Person
					className={className}
					fill={fillOptions.white100.fill}
					fillOpacity={fillOptions.white100.fillOpacity}
				/>

				<div className={`user-header__text ${className['user-header__text']}`} onClick={onClickHandler}>{userName}</div>
				<div
					className={
						activeClass ? 'rotate-arrow rotate-arrow_active' : 'rotate-arrow '
					}
					onClick={onClickHandler}
				>
					<Arrow />
				</div>
				<div
					className={
						activeClass
							? 'profile-menu__container profile-menu__container_active'
							: 'profile-menu__container'
					}
				>
					{activeClass &&
						<ProfileMenu
							exitHandler={() => {
								onClickHandler(); 
								reset(); 
							}}
							className={className}
						/>}
				</div>
			</div>
		</>
	);
}

export default UserHeader;
