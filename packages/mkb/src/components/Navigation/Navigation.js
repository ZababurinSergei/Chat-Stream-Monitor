import React, {useEffect, useState, useRef, useContext} from 'react';
import style from './Navigation.module.css';
import { linkNames, adminLinkNames } from '../../config';
import { idKey } from '../../utilites/idKey';

import LinkNav from '../LinkNav/LinkNav';
import isEmpty from "../../utilites/isEmpty";
import FilterMenu from '../DiagnosisCoding/FilterMenu';
import { UserContext } from '@src/App';

function Navigation({ active, setActive, option, selectOption, className = {}, isOpen, setOpen, userRole }) {
  const menuitem = useRef(null)
  const {userInfo} = useContext(UserContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuitem.current && !menuitem.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuitem]);

  return (
    <>
      {/* {(userRole === 'mkb_admin' ? adminLinkNames : linkNames) */}
      {(userRole === 'mkb_admin' ? adminLinkNames : linkNames)
        .map(item => {
          return <React.Fragment
            key={idKey()}
        >
          {!isEmpty(item.chapter) ? (
            <div
                ref={menuitem}
                onClick={() => {setOpen(!isOpen)}}
                className={`link__navigation ${className.link__navigation}`}
            >
              {item.name}

              {isOpen &&
                <div
                    onMouseLeave={() => {
                      setOpen(false)
                    }}
                    className={style.navLinks}
                >
                  <FilterMenu
                      className={style}
                      selectOption={selectOption}
                      filterCategories={item.chapter}
                  />
                </div>}
            </div>
          ) : (<>

            {!!item.isAuth && !isEmpty(userInfo) && !isEmpty(userInfo.roles) ? (
                <>
                  {userInfo.roles.some(item => item === 'mkb_admin')
                    ? (<LinkNav
                          active={active}
                          setActive={setActive}
                          className={className}
                          key={ idKey() }
                          name={ item.name }
                          link={ item.link }
                      />)
                    : ('')}
                </>
              ):('')}
            {!item.isAuth &&
                <LinkNav
                    active={active}
                    setActive={setActive}
                    className={className}
                    key={ idKey() }
                    name={ item.name }
                    link={ item.link }
                />}
          </>
          )}
        </React.Fragment>
      })}
    </>
  );
}

export default Navigation;
