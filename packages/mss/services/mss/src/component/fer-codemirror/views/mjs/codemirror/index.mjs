/* eslint-disable */
// import loader from '../loader/loader.mjs'
export const codemirror = (textNode, mode, readOnly = false)=> {
    return new Promise( async (resolve, reject) => {
        // await loader('/services/rules/src/component/fer-codemirror/views/mjs/codemirror/codemirror_5_21_0.js', 'CodeMirror')
        // await loader('/services/rules/src/component/fer-codemirror/views/mjs/codemirror/search.js', 'search')
        // await loader('/services/rules/src/component/fer-codemirror/views/mjs/codemirror/searchcursor.js', 'searchcursor')
        // await loader('/services/rules/src/component/fer-codemirror/views/mjs/codemirror/match-highlighter.js', 'match-highlighter')
        // await loader('/services/rules/src/component/fer-codemirror/views/mjs/codemirror/jump-to-line.js', 'jump-to-line')
        // await loader('/services/rules/src/component/fer-codemirror/views/mjs/codemirror/dialog.js', 'dialog')
        // await loader('/services/rules/src/component/fer-codemirror/views/mjs/codemirror/runmode.js', 'runmode')
        // console.log('ddddddddddddddddd', window.CodeMirror)
        // 

        let CodeMirror = window.CodeMirror
        // theme: 'one-dark',
        let editor = CodeMirror.fromTextArea(textNode, {
            mode:  `${mode}`,
            readOnly: readOnly,
            lineNumbers: false,
            smartIndent: true,
            searchMode: 'popup',
            lineWrapping: true,
            autoRefresh: true,
            autocorrect: true,
            placeholder: 'Код',
            extraKeys: {
                "Ctrl-Q": function(cm){
                    console.log('~~~~~Ctrl-Q~~~~~~~~~~~', cm)
                },
                "Ctrl-F": function(cm){
                    cm.execCommand("find")
                    console.log('~~~~~Ctrl-F~~~~~~~~~~~', cm)
                },
                "Ctrl-G": function(cm){
                    console.log('~~~~~Ctrl-Q~~~~~~~~~~~', cm)
                },
                "Ctrl-Shift-G": function(cm){
                    console.log('~~~~~Ctrl-Q~~~~~~~~~~~', cm)
                },
                "Ctrl-Shift-F": function(cm){
                    console.log('~~~~~Ctrl-Q~~~~~~~~~~~', cm)
                },
                "Ctrl-Shift-R": function(cm){
                    console.log('~~~~~Ctrl-Q~~~~~~~~~~~', cm)
                },
                "Alt-F": function(cm){
                    console.log('~~~~~Ctrl-Q~~~~~~~~~~~', cm)
                },
                "Alt-G": function(cm){
                    console.log('~~~~~Ctrl-Q~~~~~~~~~~~', cm)
                },
            }
        });

        resolve(editor)
    })
}

export default {
    description: 'codemirror'
}
