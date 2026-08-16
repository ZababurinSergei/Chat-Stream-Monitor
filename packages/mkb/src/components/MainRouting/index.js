import React, {Suspense, lazy, useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import routes from '../../modules';
import { idKey } from '@src/utilites/idKey'
import {useDispatch} from "react-redux";
import {globalActions} from "../../modules/Main/reducers/global";
import {isMobile} from "react-device-detect";

const Elements = routes.map((route) => {
    const { module, path, Body } = route;
    const LazyComponent = lazy(() => import(`../../modules/${module}/index.js`));

    if(module) {
        const RenderFn = () => {
            const [ismobileleftmenu, setmobileleftmenu] = useState("true")

            if(window.location.pathname.startsWith('/external')) {
                return (
                    <Suspense fallback={<p>Загрузка...</p>}>
                        <LazyComponent
                            ismobileleftmenu={ismobileleftmenu}
                            setmobileleftmenu={setmobileleftmenu}
                        />
                    </Suspense>
                );
            } else {
                return (
                    <Body
                        ismobileleftmenu={ismobileleftmenu}
                        setmobileleftmenu={setmobileleftmenu}
                    >
                        <Suspense fallback={<p>Загрузка...</p>}>
                            <LazyComponent
                                ismobileleftmenu={ismobileleftmenu}
                                setmobileleftmenu={setmobileleftmenu}
                            />
                        </Suspense>
                    </Body>
                );
            }

        };
        return <Route key={idKey()} path={path} element={<RenderFn />} />
    }
})


export const MainRouting = () => {
    const dispatch = useDispatch()

    dispatch(
        globalActions.initial({
            version: 'v0.8.8',
            device: isMobile
        })
    )

    return (
        <BrowserRouter>
            <Routes>
                { Elements }
            </Routes>
        </BrowserRouter>
    );
};

export default MainRouting;
