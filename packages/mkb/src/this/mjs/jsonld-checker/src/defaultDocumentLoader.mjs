const jsonld = window.jsonld

const CONTEXTS = {};

// From https://github.com/flexdinesh/browser-or-node/blob/master/src/index.js
// const isNode =
//   typeof process !== 'undefined' &&
//   process.versions != null &&
//   process.versions.node != null;

const isNode = false

const nodeDocumentLoader = isNode
  ? jsonld.documentLoaders.node()
  : jsonld.documentLoaders.xhr();


console.log(nodeDocumentLoader)
debugger
// change the default document loader
const defaultLoader = async (url) => {
  if (url in CONTEXTS) {
    return {
      contextUrl: null,
      document: CONTEXTS[url],
      documentUrl: url,
    };
  }
  const res = await nodeDocumentLoader(url);
  CONTEXTS[url] = res.document;
  return res;
};

export default defaultLoader;
