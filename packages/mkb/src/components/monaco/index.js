import React, {useRef} from 'react'
import ReactDom from 'react-dom'
import Editor from "@monaco-editor/react";

export const CodeEditor = (props) => {
    const editorRef = useRef(null);

    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;
    }

    function showValue() {
        alert(editorRef.current.getValue());
    }

    return (
        <>
            <button onClick={showValue}>Show value</button>
            <Editor
                height="90vh"
                defaultLanguage="javascript"
                defaultValue="// some comment"
                onMount={handleEditorDidMount}
            />
        </>
    );
}