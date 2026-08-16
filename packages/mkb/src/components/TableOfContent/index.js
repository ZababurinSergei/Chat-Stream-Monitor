import React from "react";
import Toc from "../react-toc/dist";

export const TableOfContent = (props) => {
    const { mdContent, className } = props

    return (<Toc
        className={className}
        markdownText={mdContent}
        highestHeadingLevel={1}
    />);
}