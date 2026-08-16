export default (function () {

    let state = {}
    /** List of events supported by the tree view */
    let events = [
        'expand',
        'expandAll',
        'collapse',
        'collapseAll',
        'select'
    ];

    /**
     * A utilite function to check to see if something is a DOM object
     * @param {object} Object to test
     * @returns {boolean} If the object is a DOM object
     */
    function isDOMElement(obj) {
        try {
            return obj instanceof HTMLElement;
        } catch (e) {
            // Some browsers don't support using the HTMLElement so some extra
            // checks are needed.
            return typeof obj === 'object' && obj.nodeType === 1 && typeof obj.style === 'object' && typeof obj.ownerDocument === 'object';
        }
    }

    /**
     * A forEach that will work with a NodeList and generic Arrays
     * @param {array|NodeList} arr The array to iterate over
     * @param {function} callback Function that executes for each element. First parameter is element, second is index
     * @param {object} The context to execute callback with
     */
    function forEach(arr, callback, scope) {
        let i, len = arr.length;
        for (i = 0; i < len; i += 1) {
            callback.call(scope, arr[i], i);
        }
    }

    /**
     * Emit an event from the tree view
     * @param {string} name The name of the event to emit
     */
    function emit(instance, name) {
        let args = [].slice.call(arguments, 2);
        if (events.indexOf(name) > -1) {
            if (instance.handlers[name] && instance.handlers[name] instanceof Array) {
                forEach(instance.handlers[name], function (handle) {
                   let timeoutID = window.setTimeout(function () {
                        handle.callback.apply(handle.context, args);
                        clearTimeout(timeoutID)
                    }, 0);
                });
            }
        } else {
            throw new Error(name + ' event cannot be found on TreeView.');
        }
    }

    /**
     * Renders the tree view in the DOM
     */
    function render() {
        let self = this
        let container = isDOMElement(this.node) ? this.node : document.getElementById(this.node);
        let leaves = [], click;
        let count = 0
        let renderLeaf = function (item) {
            count = count + 1
            const isExpand = self.expandedArray.some(item => item === count)

            let leaf = document.createElement('div');
            let content = document.createElement('div');
            let text = document.createElement('div');
            let expando = document.createElement('div');
            leaf.setAttribute('class', 'tree-leaf');
            content.setAttribute('class', 'tree-leaf-content');
            content.setAttribute('data-item', JSON.stringify(item));
            text.setAttribute('class', item.children.length === 0 ? 'tree-leaf-text no-children' : 'tree-leaf-text');
            // text.textContent = item.name;

            text.insertAdjacentHTML('afterbegin',  `${ item.name }`)

            if(isExpand) {
                // leaf.classList.add('line');
            } else {
                leaf.classList.add('angle');
            }

            expando.setAttribute('class', 'tree-expando ' + (item.expanded ? 'expanded' : ''));

            expando.insertAdjacentHTML('afterbegin', item.expanded || isExpand
                ? `
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path fill-rule="evenodd" clip-rule="evenodd" d="M5 4C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H5ZM2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5Z" fill="#6E8FB0"/>
                       <path fill-rule="evenodd" clip-rule="evenodd" d="M7 12C7 11.4477 7.44772 11 8 11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H8C7.44772 13 7 12.5523 7 12Z" fill="#6E8FB0"/>
                     </svg>
                 `
                 : `
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path fill-rule="evenodd" clip-rule="evenodd" d="M5 4C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H5ZM2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5Z" fill="#6E8FB0"/>
                       <path fill-rule="evenodd" clip-rule="evenodd" d="M12 7C12.5523 7 13 7.44772 13 8V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V8C11 7.44772 11.4477 7 12 7Z" fill="#6E8FB0"/>
                       <path fill-rule="evenodd" clip-rule="evenodd" d="M7 12C7 11.4477 7.44772 11 8 11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H8C7.44772 13 7 12.5523 7 12Z" fill="#6E8FB0"/>
                     </svg>
                 `)
            content.appendChild(expando);
            content.appendChild(text);
            leaf.appendChild(content);

            if (item.children && item.children.length > 0) {
                let children = document.createElement('div');
                children.setAttribute('class', 'tree-child-leaves');
                forEach(item.children, function (child) {
                    let childLeaf = renderLeaf(child);
                    children.appendChild(childLeaf);
                });
                if (!item.expanded && !isExpand) {
                    children.classList.add('hidden');
                }
                leaf.appendChild(children);
            } else {
                expando.classList.add('hidden');
            }
            return leaf;
        };

        forEach(this.data, function (item) {
            leaves.push(renderLeaf.call(self, item));
        });

        container.innerHTML = leaves.map(function (leaf) {
            return leaf.outerHTML;
        }).join('');

        click = function (e) {
            let parent = (e.target || e.currentTarget).closest('.tree-leaf-content');
            let data = JSON.parse(parent.getAttribute('data-item'));
            let leaves = parent.parentNode.querySelector('.tree-child-leaves');

            if (leaves && e.currentTarget.className.includes('tree-expando')) {
                if (leaves.classList.contains('hidden')) {
                    self.expand(parent, leaves);
                } else {
                    self.collapse(parent, leaves);
                }
            } else {
                emit(self, 'select', {
                    target: e,
                    data: data
                });
            }
        };

        forEach(container.querySelectorAll('.tree-leaf-text'), function (node) {
            node.onclick = click;
        });

        forEach(container.querySelectorAll('.tree-expando'), function (node) {
            node.onclick = click;
        });
    }

    /**
     * @constructor
     * @property {object} handlers The attached event handlers
     * @property {object} data The JSON object that represents the tree structure
     * @property {DOMElement} node The DOM element to render the tree in
     */
    function TreeView(data, node, expandedArray = []) {
        this.handlers = {};
        this.node = node;
        this.data = data;
        this.expandedArray = expandedArray;
        this.render = render.bind(this);
        this.render();
    }

    /**
     * Expands a leaflet by the expando or the leaf text
     * @param {DOMElement} node The parent node that contains the leaves
     * @param {DOMElement} leaves The leaves wrapper element
     */
    TreeView.prototype.expand = function (node, leaves, skipEmit) {
        console.log('@@@@@@@@@@@@@@ EXPAND @@@@@@@@@@@@@@', {
            node: node,
            leaves: leaves
        })
        let expando = node.querySelector('.tree-expando');

        // expando.textContent = '-';
        expando.innerHTML = ''
        expando.insertAdjacentHTML('afterbegin', `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path fill-rule="evenodd" clip-rule="evenodd" d="M5 4C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H5ZM2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5Z" fill="#6E8FB0"/>
                       <path fill-rule="evenodd" clip-rule="evenodd" d="M7 12C7 11.4477 7.44772 11 8 11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H8C7.44772 13 7 12.5523 7 12Z" fill="#6E8FB0"/>
                     </svg>
                 `)

        leaves.classList.remove('hidden');
        if (skipEmit) {
            return;
        }
        emit(this, 'expand', {
            target: node,
            leaves: leaves
        });
    };

    TreeView.prototype.expandAll = function () {
        let self = this;
        let nodes = document.getElementById(self.node).querySelectorAll('.tree-expando');
        forEach(nodes, function (node) {
            let parent = node.parentNode;
            let leaves = parent.parentNode.querySelector('.tree-child-leaves');
            if (parent && leaves && parent.hasAttribute('data-item')) {
                self.expand(parent, leaves, true);
            }
        });
        emit(this, 'expandAll', {});
    };

    /**
     * Collapses a leaflet by the expando or the leaf text
     * @param {DOMElement} node The parent node that contains the leaves
     * @param {DOMElement} leaves The leaves wrapper element
     */
    TreeView.prototype.collapse = function (node, leaves, skipEmit) {
        let expando = node.querySelector('.tree-expando');
        expando.innerHTML = ''
        expando.insertAdjacentHTML('afterbegin', `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5 4C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H5ZM2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5Z" fill="#6E8FB0"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12 7C12.5523 7 13 7.44772 13 8V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V8C11 7.44772 11.4477 7 12 7Z" fill="#6E8FB0"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M7 12C7 11.4477 7.44772 11 8 11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H8C7.44772 13 7 12.5523 7 12Z" fill="#6E8FB0"/>
            </svg>
        `)
        // expando.textContent = '+';
        leaves.classList.add('hidden');
        if (skipEmit) {
            return;
        }
        emit(this, 'collapse', {
            target: node,
            leaves: leaves
        });
    };

    /**
     */
    TreeView.prototype.collapseAll = function () {
        let self = this;
        let nodes = document.getElementById(self.node).querySelectorAll('.tree-expando');
        forEach(nodes, function (node) {
            let parent = node.parentNode;
            let leaves = parent.parentNode.querySelector('.tree-child-leaves');
            if (parent && leaves && parent.hasAttribute('data-item')) {
                self.collapse(parent, leaves, true);
            }
        });
        emit(this, 'collapseAll', {});
    };

    /**
     * Attach an event handler to the tree view
     * @param {string} name Name of the event to attach
     * @param {function} callback The callback to execute on the event
     * @param {object} scope The context to call the callback with
     */
    TreeView.prototype.on = function (name, callback, scope) {
        if (events.indexOf(name) > -1) {
            if (!this.handlers[name]) {
                this.handlers[name] = [];
            }
            this.handlers[name].push({
                callback: callback,
                context: scope
            });
        } else {
            throw new Error(name + ' is not supported by TreeView.');
        }
    };

    /**
     * Deattach an event handler from the tree view
     * @param {string} name Name of the event to deattach
     * @param {function} callback The function to deattach
     */
    TreeView.prototype.off = function (name, callback) {
        let index, found = false;
        if (this.handlers[name] instanceof Array) {
            this.handlers[name].forEach(function (handle, i) {
                index = i;
                if (handle.callback === callback && !found) {
                    found = true;
                }
            });
            if (found) {
                this.handlers[name].splice(index, 1);
            }
        }
    };

    return TreeView;
}());