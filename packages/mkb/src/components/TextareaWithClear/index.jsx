import React from "react";
import { ReactComponent as Close } from "./assets/close.svg";

export const TextareaWithClear = ({ value, onChangeHandler, placeholder, cn, disabled }) => {
  return (
    <div className="relative">
      <textarea
        placeholder={placeholder}
        className={`!pr-6 ${cn}`}
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChangeHandler(e.target.value)}
      >
      </textarea>
      {!disabled && value && <Close
        onClick={() => onChangeHandler("")}
        className="absolute 
        top-[50%] 
        mt-[-6px] 
        right-4
        cursor-pointer"
      />}
    </div>
  );
};
