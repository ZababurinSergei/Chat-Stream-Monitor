export class LoadTracker {
    constructor() {
        this._pendingOperations = new Set();
        this._isLoaded = false;
        this._loadCallbacks = [];
        this._observer = null;
    }

    track(operation) {
        if (this._isLoaded) return operation;

        const id = Symbol('operation');
        this._pendingOperations.add(id);

        const cleanup = () => {
            this._pendingOperations.delete(id);
            this._checkLoad();
        };

        // Безопасная обработка Promise и не-Promise значений
        if (operation && typeof operation.finally === 'function') {
            operation.finally(cleanup);
        } else {
            Promise.resolve(operation).finally(cleanup);
        }

        return operation;
    }

    trackDOM(element) {
        if (this._isLoaded || !element) return;

        const id = Symbol('dom-element');
        this._pendingOperations.add(id);

        const checkReady = () => {
            if (element.isConnected && element.offsetHeight > 0) {
                this._pendingOperations.delete(id);
                this._checkLoad();
                return true;
            }
            return false;
        };

        if (!checkReady()) {
            const observer = new MutationObserver(checkReady);
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
            });
            this._pendingOperations.add(observer);
        }
    }

    onLoad(callback) {
        if (this._isLoaded) {
            callback();
        } else {
            this._loadCallbacks.push(callback);
        }
    }

    _checkLoad() {
        if (this._isLoaded || this._pendingOperations.size > 0) return;

        this._isLoaded = true;
        this._loadCallbacks.forEach(cb => cb());
        this._loadCallbacks = [];
    }
}