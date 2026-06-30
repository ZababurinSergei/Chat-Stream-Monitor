export class LayoutManager {
    constructor(terminal) {
        this.terminal = terminal;
        this.isResizing = false;
    }

    init() {
        //this.setupLayoutResizing();
        return this;
    }

    setupLayoutResizing() {
        const layout = document.querySelector('.three-column-layout');
        const terminal = document.querySelector('.terminal-container');
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'layout-resize-handle';
        layout.parentNode.insertBefore(resizeHandle, layout);

        let startY, startLayoutHeight, startTerminalHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.isResizing = true;
            startY = e.clientY;
            startLayoutHeight = parseInt(getComputedStyle(layout).height);
            startTerminalHeight = parseInt(getComputedStyle(terminal).height);
            document.body.style.cursor = 'row-resize';
            document.addEventListener('mousemove', this.handleResize);
            document.addEventListener('mouseup', this.stopResize);
            e.preventDefault();
        });

        this.handleResize = (e) => {
            if (!this.isResizing) return;
            const dy = startY - e.clientY;

            const newLayoutHeight = Math.max(200, Math.min(
                startLayoutHeight + dy,
                window.innerHeight - 200
            ));

            const newTerminalHeight = Math.max(100, Math.min(
                startTerminalHeight - dy,
                window.innerHeight - 150
            ));

            layout.style.height = `${newLayoutHeight}px`;
            terminal.style.height = `${newTerminalHeight}px`;
        };

        this.stopResize = () => {
            this.isResizing = false;
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', this.handleResize);
            document.removeEventListener('mouseup', this.stopResize);
            localStorage.setItem('layoutHeight', layout.style.height);
            localStorage.setItem('terminalHeight', terminal.style.height);
        };

        const savedLayoutHeight = localStorage.getItem('layoutHeight');
        const savedTerminalHeight = localStorage.getItem('terminalHeight');
        if (savedLayoutHeight) layout.style.height = savedLayoutHeight;
        if (savedTerminalHeight) terminal.style.height = savedTerminalHeight;
    }
}