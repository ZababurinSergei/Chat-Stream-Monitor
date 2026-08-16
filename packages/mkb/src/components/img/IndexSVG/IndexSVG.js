import React from 'react';
import './IndexSVG.style.css';

import SquareMinus from '../SquareMinus/SquareMinus';
import SquarePlus from '../SquarePlus/SquarePlus';
import CirclePlus from '../CirclePlus/CirclePlus';
import CircleCross from '../CircleCross/CircleCross';
import CrossHelp from '../CrossHelp/CrossHelp';
import  StyleMap from '../StyleMap/StyleMap';
import Check from '../Check/Check';
import Exit from '../Exit/Exit';
import Person from '../Person/Person';
import Bell from '../Bell/Bell';


function IndexSVG() {
	return (
		<div className='index-svg'>
            <SquareMinus />
            <SquarePlus />
            <CirclePlus />
            <CircleCross />
            <CrossHelp />
            <StyleMap />
            <Check />
            <Exit />
            <Person fill={ '#C7D2E3' } fillOpacity={ 1 }/>
            <Bell />
		</div>
	);
}

export default IndexSVG;
