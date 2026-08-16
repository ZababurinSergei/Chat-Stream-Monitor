import { store, isEmpty } from '../../../index.mjs'
import { env } from '/env.mjs'
export async function getTokenPair(code) {
    try {
        // const data = await api.post('/auth/code', {
        //     code
        // })
        // return data;
    } catch (e) {
        console.error('не был получен токкен')
    }
}

export async function getUserInfo(accessToken) {
    if(accessToken) {
        // const data = await api.get('/auth/userinfo', {
            // withCredentials: true,
            // headers: {
            //     'Authorization': `Bearer ${accessToken}`
            // }
        // })
        // return data;
    } else {
        // console.log('авторизация: нет токкена')
        return  []
    }

}

export async function getRefreshToken(refreshToken) {
    // const data = await api.post('/auth/refresh', {
    //     refreshToken: refreshToken
    // })
    // return data;
}

export const signIn = () => {
    document.dispatchEvent(new Event('rules-singIn', {
        bubbles: true,
        composed: true,
    }));

    let egiszUrl = env().WEB_APP_LOGIN
    window.location.href = egiszUrl;
};

export const logOut = () => {
    const egiszUrlLogout = env().WEB_APP_LOGOUT_DEV
    window.location.href = egiszUrlLogout;
};

export const resetTokens = () => {
    store.set('accessToken', '')
    store.set('refreshToken', '')
};

export const useAuth = () => {
    let accessToken = undefined
    let refreshToken = undefined
    let alreadyUsedCode = undefined
    let userInfo = undefined
    const interval = setInterval(() => {
        const refresh = store.get('refreshToken')
        if(!isEmpty(refresh)) {
            getRefreshToken(refresh)
                .then(({ data }) => {
                    store.set('accessToken', data.accessToken)
                    store.set('refreshToken', data.refreshToken)
                })
                .catch(error => { });
        }
    })

    const params = new URLSearchParams(document.location.search);
    const code = params.get('code');

    if (code?.length && code !== alreadyUsedCode) {
        try {
            getTokenPair(code)
                .then(data => {
                    if (!isEmpty(data) && data.status === 200) {
                        accessToken = data.data.accessToken
                        refreshToken = data.data.refreshToken
                        userInfo = data.data.userinfo
                        // setAccessToken(data.data.accessToken);
                        // setRefreshToken(data.data.refreshToken);
                        // setUserInfo(data.data.userinfo);
                    }
                })
                .catch(err => {
                    console.log(err);
                })
                .finally(() => alreadyUsedCode = code);
        } catch (error) {
            console.log(error);
        }
    } else {
        if (accessToken) {
            try {
                getUserInfo(accessToken)
                    .then(({ data }) => {
                        userInfo = data
                        // !userInfo && setUserInfo(data);
                    })
                    .catch(error => {
                        console.log(error);
                        setAccessToken('');
                    });
            } catch (error) {
                console.log(error);
            }
        } else if (refreshToken && !accessToken) {
            try {
                getRefreshToken(refreshToken)
                    .then(({ data }) => {
                        accessToken = data.data.accessToken
                        refreshToken = data.data.refreshToken
                        // setAccessToken(data.accessToken);
                        // setRefreshToken(data.refreshToken);
                        // setUserInfo(data.userinfo);
                    })
                    .catch(error => {
                        if(error.request.status !== 500) {
                            console.log(error);
                            refreshToken = ''
                            userInfo = ''
                            // setRefreshToken('');
                            // setUserInfo('');
                            logOut();
                        } else {
                            refreshToken = ''
                            userInfo = ''
                            // setRefreshToken('');
                            // setUserInfo('');
                        }
                    });
            } catch (error) {
                console.log(error);
            }
        }
        // else if (!refreshToken && !accessToken) {
        //   (process.env.NODE_ENV === 'production') && signIn();
        // }
    }
}
