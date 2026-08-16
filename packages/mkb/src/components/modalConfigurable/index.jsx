import React, { useState } from "react";
import ReactDom from "react-dom";
import Modal from "react-modal";
import style from "./index.module.css";
import Close from "../img/Close";
import { MainButton, DeleteButton, SecondButton } from "../Button/Button";
import { Splitter } from "../Splitter";

export const ModalWindowConfigurable = ({
  type,
  setModal,
  isModal,
  children,
  data,
  className = {},
  config = {},
}) => {
  let subtitle;
  const [modalIsOpen, setIsOpen] = useState(false);

  Modal.setAppElement("*");

  function afterOpenModal() {}

  function closeModal() {
    // window.history.replaceState({}, "", `${window.location.origin}/coding`);

    setModal(false);
    if(!config?.cancelBtn) config.okBtn.handler()
  }

  const customStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(51, 51, 51,0.5)",
      zIndex: "100000",
    },
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      maxHeight: "90vw",
      width: type === "window" ? "90vw" : "",
      marginRight: "-50%",
      marginTop: "1.7%",
      padding: "0",
      transform: "translate(-50%, -50%)",
      zIndex: "100000",
      overflow: "inherit",
    },
  };

  return (
    <div className={className.modal}>
      <Modal
        isOpen={isModal}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="modal window for content"
      >
        <div className={`${style.container} ${className.container}`}>
          {type !== "window" && (
            <>
              <div className={style.header}>
                <div className={style.titleHeader}>{config.title}</div>
                <div onClick={closeModal}>
                  <Close className={style.icon} />
                </div>
              </div>
              {/* <hr /> */}
            </>
          )}
          <div className={`${style.body}`}>{config.body}</div>
          <div className={`${style.footer} footer`}>
            {config?.cancelBtn && <SecondButton
              buttonCheckImg={false}
              buttonLabel={config?.cancelBtn?.label}
              buttonHandler={() => {
                config?.cancelBtn?.handler && config?.cancelBtn?.handler();
                setModal(false);
              }}
            />}
            <Splitter width={10} />
            <DeleteButton
              buttonLabel={config?.okBtn?.label}
              buttonHandler={config?.okBtn?.handler}
            />
          </div>
          {children}
        </div>
      </Modal>
    </div>
  );
};
