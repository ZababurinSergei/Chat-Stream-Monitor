export const unflatten = (items) => {
    let tree = []
    let mappedArr = {}
    items.forEach(function(item) {
        let id = item.id;
        if (!mappedArr.hasOwnProperty(id)) {
            mappedArr[id] = item;
            mappedArr[id].children = [];
        }
    })
    for (let id in mappedArr) {
        if (mappedArr.hasOwnProperty(id)) {
           let mappedElem = mappedArr[id];
            if (mappedElem.parent !== null) {
                let parentId = mappedElem.parent;
                mappedArr[parentId].children.push(mappedElem);
            }
            else {
                tree = mappedElem;
            }
        }
    }

    return tree;
}
export const flattenTree = function (tree, axisName) {
    let count = 0;
    const flattenedTree = [];
    const flattenTreeHelper = function (tree, parent) {
        tree.id = count;
        tree.parent = parent;
        flattenedTree[count] = tree;
        count += 1;

        if (tree.children == null || tree.children.length === 0) return;
        for (const child of tree.children) {
            flattenTreeHelper(child, tree.id);
        }
        tree.children = tree.children.map((x) => x.id);
    };

    flattenTreeHelper(tree, null);
    return flattenedTree;
};