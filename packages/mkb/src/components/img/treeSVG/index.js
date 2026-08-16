import React from 'react';
import './IndexSVG.style.css';

import SquareMinus from '../SquareMinus/SquareMinus';
import SquarePlus from '../SquarePlus/SquarePlus';

function TreeSVG({isBranch = false, isOpen = false, width = "24", height = "24", className = ''}) {
    if(isBranch) {
        if(isOpen) {
            return (
                <SquareMinus
                    width={width}
                    height={height}
                    className={className}
                />);
        } else {
            return (
                <SquarePlus
                    width={width}
                    height={height}
                    className={className}
                />);
        }
    }
}

export default TreeSVG;
