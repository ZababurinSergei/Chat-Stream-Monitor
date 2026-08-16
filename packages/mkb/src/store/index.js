import { createStore, IModuleStore } from "redux-dynamic-modules";
import { getSagaExtension } from 'redux-dynamic-modules-saga';

const store = createStore({
      initialState: {  },
      enhancers: [  ],
      extensions: [getSagaExtension(), { middleware: [] }]
}, );


export default store;
