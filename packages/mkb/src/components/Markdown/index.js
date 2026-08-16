import React from "react";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'

const flatten = (text, child) => {
    return typeof child === "string"
        ? text + child
        : React.Children.toArray(child.props.children).reduce(flatten, text);
};

export const HeadingRenderer = (props) => {
    var children = React.Children.toArray(props.children);
    var text = children.reduce(flatten, "");
    var slug = text.toLowerCase().replace(/[!?\s]/g, "-");
    return React.createElement(
        "h" + props.level,
        { id: slug, className: "anchor" },
        props.children
    );
};

export const Markdown = (props) => {
    const { mdContent, className } = props

    return <ReactMarkdown
        children={mdContent}
        remarkPlugins={[remarkGfm]}
        className={className}
        components={{
            code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                    <SyntaxHighlighter
                        children={String(children).replace(/\n$/, '')}
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                    />
                ) : (
                    <code className={className} {...props}>
                        {children}
                    </code>
                )
            },
            h1: HeadingRenderer,
            h2: HeadingRenderer,
        }}
    />;
};