import React, { useState } from 'react';
import './Header.style.css';
import { name } from '../../../config';

import Navigation from '../../Navigation/Navigation';
import Logotype from '../../img/Logotype/Logotype';
import SingIn from '../../SingIn/SingIn';
import UserHeader from '../../UserHeader/UserHeader';

function Header() {

const [changeProfile, setChangeProfile] = useState(false);

    const onChangeProfile = () => {
      setChangeProfile(true);
    };

	return (
		<>
			<div className="header__wrapper">
				<div className="header__container-left">
                    <div className="header__logo-name">
                        <Logotype />
                        <p className="header__name">{ name }</p>
                    </div>
                    <nav className="header__navigation">
                        <Navigation />
                    </nav>
                </div>
                <div className="header__container-right" onClick={ onChangeProfile }> {
                        changeProfile
                            ? <UserHeader />
                            : <SingIn />
                    }
                </div>
			</div>
		</>
	);
}

export default Header;
