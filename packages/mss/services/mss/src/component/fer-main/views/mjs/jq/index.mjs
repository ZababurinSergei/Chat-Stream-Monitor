/* eslint-disable */
import JQ from './wasm/jq.mjs'

let outputJq = []

export default () => {
    return new Promise((resolve, reject) => {
        let JqTerm = undefined;

        function jq(data, query) {
            try {
                var fileName = "/tmp/data.json";
                let jsonStr = JSON.stringify(data)
                JqTerm.FS.writeFile(fileName, jsonStr);

                outputJq = [];
                JqTerm.callMain([ "-M", "-r", "-c", query, fileName ]);

                return outputJq;
            } catch (e) {
                console.error(e)
            }
        }

        JQ({
            // Don't run main on page load
            noInitialRun: true,
            // Print functions
            print: stdout => outputJq = stdout,
            printErr: stderr => console.warn(stderr),

            // When the module is ready
            onRuntimeInitialized: async function() {
                JqTerm = this
                // window.zb.jq = {}
                // window.zb.jq.self = this
                // window.zb.jq.fs = this.FS
                // system.worker_main["markdown__jasonelle_android_run"].disabled = false;
                // if(!system.worker_main['checkbox.checked']) {
                //     system.worker_main["markdown__string_menu_json_html_run"].disabled = false;
                //     system.worker_main["markdown__string_menu_json_code_run"].disabled = false;
                // } else {
                //     system.worker_main["markdown__string_menu_json_html_run"].disabled = true;
                //     system.worker_main["markdown__string_menu_json_code_run"].disabled = true;
                // }
                resolve(jq)
            }
        })

    })
}
