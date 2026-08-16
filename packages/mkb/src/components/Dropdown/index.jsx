import { useCallback, useEffect, useRef, useState } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import "./index.scss";
import { ReactComponent as ArrowIcon } from "./assets/arrow.svg";
import { NavLink } from "react-router-dom";

export const Dropdown = ({ title, editBtnClickHandler, deleteBtnClickHandler }) => {
  const dropdownRef = useRef();
  // console.log(dropdownRef);
  const [isActive, setIsActive] = useState(false);

  const onClick = () => {
    setIsActive(!isActive);
  };

  const onWindowClick = useCallback((e) => {
    // console.log(initialState)
    // If the active element exists and is clicked outside of
    if (
      dropdownRef.current !== null &&
      dropdownRef?.current &&
      !dropdownRef?.current.contains(e.target)
    ) {
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("click", onWindowClick);
    return () => {
      window.removeEventListener("click", onWindowClick);
    };
  }, []);

  return (
    <div className="dropdown__container" ref={dropdownRef}>
      <div className="dropdown__btn" onClick={onClick}>
        {title}
        <ArrowIcon />
      </div>
      <div className={`dropdown__content ${isActive ? "active" : "inactive"}`}>
        <div className="dropdown__info">
          <ul>
            <li>
              {/* <NavLink to={"/admin/edit-records"} onClick={editBtnClickHandler}>
                Отредактировать записи
              </NavLink> */}
              <a onClick={editBtnClickHandler}>Отредактировать записи</a>
            </li>
            <li>
              {/* <NavLink to={"/admin/delete-records"}>Удалить записи</NavLink> */}
              <a onClick={deleteBtnClickHandler}>Удалить записи</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
