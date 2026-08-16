import React, {useEffect} from 'react';
import './index.style.css';
import { Link } from "react-router-dom";
import { path } from './path/index'

function LinkNav({ active, setActive, onClick, link, name, className = {} }) {
    return (
        <>
            <Link
                onClick={() => {
                    setActive(link)
                }}
                to={`${path.join(process.env.PUBLIC_URL, link)}`}
                className={`link__navigation ${className.link__navigation} ${active === path.join(process.env.PUBLIC_URL, link) || path.join(process.env.PUBLIC_URL, link) === path.join(process.env.PUBLIC_URL, active)  ? 'isActiveLink': ''}`}
            >
                { name }
            </Link>
        </>
    );
}

export default LinkNav;
