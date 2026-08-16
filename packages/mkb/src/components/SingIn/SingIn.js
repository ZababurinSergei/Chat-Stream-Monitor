import React, {useState} from 'react';
import './SingIn.style.css';
import { profile, fillOptions } from '../../config';
import Person from '../img/Person/Person';


function SingIn({className, clickHandle}) {
	className=(className) ? className : {}

	return (
		<div className={`sign-in ${className['sign-in']}`}>
			<Person
				className={className}
        		fill={ fillOptions.black20.fill }
        		fillOpacity={ fillOptions.black20.fillOpacity }
      		/>
			<div onClick={clickHandle} className={`sign-in__text ${className['sign-in__text']}`}>{profile.singIn}</div>
		</div>
	);
}

export default SingIn;
