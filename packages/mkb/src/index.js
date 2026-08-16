import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './font.style.css';
import { available } from './modules/api';
import web from '../package.json';
import axios from '@src/utilites/API';
import isEmpty from './utilites/isEmpty';

let Release = '';
let Lang = '';

window.localStorage.setItem('isSearchResult', false);
window.localStorage.removeItem('releaseGroup');
window.localStorage.removeItem('releaseId');
window.localStorage.removeItem('releaseLang');
window.localStorage.removeItem('sid');

available()
    .then((api) => {
        const params = new URLSearchParams(document.location.search);
        Release = params.get('Release');
        Lang = params.get('Lang');
        const sid = params.get('sid');

        if(sid !== null) {
            localStorage.setItem('sid', sid);
        }

        Release = (Release !== null && Lang !== null) ? Release : api.Release;
        Lang = (Release !== null && Lang !== null) ? Lang : api.Lang;

        if(Release === null && Lang === null) {
            let data = localStorage.getItem('mkb_api');
            if(!isEmpty(data)) {
                const {
                    api: {
                        current: {
                            Lang: lang,
                            Release: release
                        }
                    }
                } = JSON.parse(data);

                Release = release;
                Lang = lang;
            } else {
                Release = api.Release;
                Lang = api.Lang;
            }
        }
    }).catch(e => {
        const params = new URLSearchParams(document.location.search);
        Release = params.get('Release');
        Lang = params.get('Lang');

        Release = (Release !== null && Lang !== null) ? Release : '2202-02';
        Lang = (Release !== null && Lang !== null ) ? Lang : 'ru';

        console.error({
            'Произошла ошибка при получении версии, используется версия по умолчанию': {
                manifest: {
                    name: web.name,
                    version: web.version
                },
                api: {
                    current: {
                        Release: Release,
                        Lang: Lang
                    }
                }
            },
            'error': e
        });
    }).finally(() => {
        localStorage.setItem('mkb_api',JSON.stringify({
            manifest: {
                name: web.name,
                version: web.version
            },
            api: {
                current: {
                    Release: Release,
                    Lang: Lang
                }
            }
        }));

        axios.backend = {
            Release: Release,
            Lang: Lang
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    });
