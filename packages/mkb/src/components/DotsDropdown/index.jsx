import { useCallback, useEffect, useRef, useState } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import "./index.scss";
import { ReactComponent as DotsIcon } from "./assets/dots.svg";
import { ReactComponent as ReviewIcon } from "./assets/review.svg";
import { ReactComponent as EditIcon } from "./assets/edit.svg";
import { ReactComponent as DeleteIcon } from "./assets/delete.svg";
import { NavLink } from "react-router-dom";
import { ModalWindowConfigurable } from "../modalConfigurable";

export const DotsDropdown = ({
  editBtnClickHandler,
  deleteBtnClickHandler,
  previewBtnClickHandler,
}) => {
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
    <div className="dots_dropdown__container" ref={dropdownRef}>
      <div className="dots_dropdown__btn" onClick={onClick}>
        <DotsIcon />
      </div>
      <div
        className={`dots_dropdown__content ${isActive ? "active" : "inactive"}`}
      >
        <div className="dots_dropdown__info">
          <ul>
            {previewBtnClickHandler && (
              <li>
                {/* <NavLink to={"/admin/edit-record"}>
                <ReviewIcon /> Просмотреть
              </NavLink> */}
                <a onClick={previewBtnClickHandler}>
                  <ReviewIcon /> Просмотреть
                </a>
              </li>
            )}
            {editBtnClickHandler && (
              <li>
                {/* <NavLink to={"/admin/edit-record"}>
                <EditIcon />
                Редактировать
              </NavLink> */}
                <a onClick={editBtnClickHandler}>
                  <EditIcon />
                  Редактировать
                </a>
              </li>
            )}
            {deleteBtnClickHandler && (
              <li>
                <a onClick={deleteBtnClickHandler}>
                  <DeleteIcon />
                  Удалить{" "}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
