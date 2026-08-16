import React, { useEffect, useState, useContext } from "react";
import { name } from "../../../config";
import style from "./index.module.css";
import Navigation from "../../Navigation/Navigation";
import Logotype from "../../img/Logotype/Logotype";
import SingIn from "../../SingIn/SingIn";
import UserHeader from "../../UserHeader/UserHeader";
import { Accordion } from "../Accordion";
import { isMobile, isTablet, isDesktop } from "react-device-detect";
import { SideBar } from "../../img/SideBar";
import { useNavigate } from "react-router-dom";
import { UserContext } from "@src/App";

export const Header = ({
  className = {},
  ismobileleftmenu,
  setmobileleftmenu,
}) => {
  const userContextValue = useContext(UserContext);
  const [userRole, setUserRole] = useState("");
  const [changeProfile, setChangeProfile] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [option, selectOption] = useState(undefined);
  const [active, setActive] = useState(window.location.pathname);
  const navigate = useNavigate();
  const onChangeProfile = () => {};

  useEffect(() => {
    if (option) {
      setOpen(false);
      navigate(`${option.link}`);
    }
  }, [option]);

  useEffect(() => {
    if (userContextValue?.userInfo?.name) setChangeProfile(true);
    else setChangeProfile(false);
    userContextValue?.userInfo?.realm_access?.roles &&
      userContextValue?.userInfo?.realm_access?.roles?.length &&
      setUserRole(userContextValue?.userInfo?.realm_access?.roles[0]);
  }, [userContextValue?.userInfo]);

  return (
    <>
      <div className={style.header__wrapper}>
        <div className={style["header__container-left"]}>
          <div className={style["header__logo-name"]}>
            <Logotype />
            <p className={style["header__name"]}>{name}</p>
            {isMobile && (
              <div
                className={style["header__container-right"]}
                onClick={onChangeProfile}
              >
                {" "}
                {changeProfile ? (
                  <UserHeader
                    className={style}
                    userName={`${userContextValue?.userInfo?.given_name} ${userContextValue?.userInfo?.family_name}`}
                    reset={() => {
                      userContextValue?.resetTokens();
                      userContextValue?.logOut();
                    }}
                  />
                ) : (
                  <SingIn
                    clickHandle={userContextValue.signIn}
                    className={style}
                  />
                )}
              </div>
            )}
          </div>
          {!isMobile || isTablet ? (
            <nav className={style["header__navigation"]}>
              <Navigation
                option={option}
                selectOption={selectOption}
                isOpen={isOpen}
                setOpen={setOpen}
                className={className}
                active={window.location.pathname.split("page")[0]}
                setActive={setActive}
                userRole={userRole}
              />
            </nav>
          ) : (
            <>
              <div className={style.headerMenu}>
                {ismobileleftmenu === "false" && (
                  <div onClick={() => setmobileleftmenu("true")}>
                    <SideBar
                      ismobileleftmenu={ismobileleftmenu}
                      className={style}
                    />
                  </div>
                )}
                <Accordion
                  option={option}
                  selectOption={selectOption}
                  className={style}
                />
              </div>
            </>
          )}
        </div>
        {(isTablet || isDesktop) && (
          <div
            className={style["header__container-right"]}
            onClick={onChangeProfile}
          >
            {" "}
            {changeProfile ? (
              <UserHeader
                className={style}
                userName={`${userContextValue?.userInfo?.given_name} ${userContextValue?.userInfo?.family_name}`}
                reset={() => {
                  userContextValue?.resetTokens();
                  userContextValue?.logOut();
                }}
              />
            ) : (
              <SingIn clickHandle={userContextValue.signIn} className={style} />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
