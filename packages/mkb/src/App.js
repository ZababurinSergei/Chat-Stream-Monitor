import React, {useLayoutEffect} from 'react';
import MainRouting from './components/MainRouting';
import { Provider } from 'react-redux';
import store from './store';
import { useAuth } from './hooks/useAuth';
import './index.css';

export const UserContext = React.createContext();

export const App = () => {
    const auth = useAuth();

    if(process.env.REACT_APP_MAIN_THEME !== 'true') {
        document.documentElement.classList.add('orange');
    }

    return (
        <Provider store={store}>
            <UserContext.Provider value={auth}>
                <MainRouting />
            </UserContext.Provider>
        </Provider>
    )
}


export default App
