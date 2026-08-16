import React from 'react';
import './Profile.style.css';
import ProfileMenuItem from '../ProfileMenuItem/ProfileMenuItem';
import Person from '../img/Person/Person';
import Exit from '../img/Exit/Exit';
import { profile, fillOptions } from '../../config';

function ProfileMenu({className, exitHandler}) {
    className = className ? className : {}

    return (
        <div className={`profile-menu__wrapper ${className['profile-menu__wrapper']}`}>
            {/* <div className={`profile-menu__item ${className['profile-menu__item']}`}>
                <ProfileMenuItem title={ profile.profileEnter }>
                <Person fill={ fillOptions.black20.fill } fillOpacity={ fillOptions.black20.fillOpacity }/>
                </ProfileMenuItem>
            </div> */}

            <div onClick={exitHandler} className={`profile-menu__item ${className['profile-menu__item']}`}>
                <ProfileMenuItem title={ profile.profileExit }>
                <Exit />
                </ProfileMenuItem>
            </div>
        </div>);
}

export default ProfileMenu;
