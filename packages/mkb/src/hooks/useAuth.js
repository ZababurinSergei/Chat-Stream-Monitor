// import { useLocalStorage } from "@src/hooks/useLocalStorage";
import { useLocalStorage } from "@uidotdev/usehooks";

import { getRefreshToken, getTokenPair, getUserInfo } from "@src/modules/api";
import { useEffect, useState, useRef } from "react";
import isEmpty from "../utilites/isEmpty";
import { redirectUrlAuth } from "../config/authConfig";
import { getCodeChallenge } from "../libs/cryptoFuncs";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import apiSingleton from "@src/utilites/API";

const isDev = window.location.hostname.includes("localhost");

const getURL = () =>
  isDev ? "https://mkb11-compose-dev.digitalms.ru/" : window.location.origin;

const signIn = async () => {
  const isPredProd = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_PREDPROD
  );

  const isProd = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_MASTER
  );

  const isDev = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_DEV
  );

  const isQa = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_QA
  );

  const isStage = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_STAGE
  );

  let egiszUrl = "";

  if (isDev) {
    egiszUrl = process.env.REACT_APP_EGISZ_URL_DEV_AUTH;
  }

  if (isQa) {
    egiszUrl = process.env.REACT_APP_EGISZ_URL_QA_AUTH;
  }

  if (isPredProd) {
    egiszUrl = process.env.REACT_APP_EGISZ_URL_PREDPROD_AUTH;
  }

  if (isProd) {
    egiszUrl = process.env.REACT_APP_EGISZ_URL_MASTER_AUTH;
  }

  if(isStage) {
    egiszUrl = process.env.REACT_APP_EGISZ_URL_STAGE_AUTH;
  }

  const { code_verifier, code_challenge } = await getCodeChallenge();
  window.localStorage.setItem("codeVerifier", JSON.stringify(code_verifier));
  // window.location.href = redirectUrlAuth(
  //   "https://mkb11-compose-dev.digitalms.ru/",
  //   code_challenge
  // );
  if(isDev) {
    window.location.href = `https://ia.helpms.ru/realms/mkb11/protocol/openid-connect/auth?response_type=code&scope=openid&client_id=web-client&redirect_uri=${getURL()}&state=123412341234adfg&code_challenge=${code_challenge}&code_challenge_method=S256`;
  } else {
    window.location.href = `${egiszUrl}&state=123412341234adfg&code_challenge=${code_challenge}&code_challenge_method=S256`;
  }
};

export const logOut = () => {
  const isPredProd = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_PREDPROD
  );

  const isDev = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_DEV
  );

  const isQa = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_QA
  );

  const isProd = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_MASTER
  );

  const isStage = window.location.hostname.includes(
    process.env.REACT_APP_PREFIX_STAGE
  );

  let egiszUrlLogout = "";

  if (isDev) {
    egiszUrlLogout = process.env.REACT_APP_EGISZ_URL_DEV_LOGOUT;
  }

  if (isQa) {
    egiszUrlLogout = process.env.REACT_APP_EGISZ_URL_QA_LOGOUT;
  }

  if (isPredProd) {
    egiszUrlLogout = process.env.REACT_APP_EGISZ_URL_PREDPROD_LOGOUT;
  }

  if (isProd) {
    egiszUrlLogout = process.env.REACT_APP_EGISZ_URL_MASTER_LOGOUT;
  }

  if (isStage) {
    egiszUrlLogout = process.env.REACT_APP_EGISZ_URL_STAGE_LOGOUT;
  }

  let id_token_hint = window.localStorage.getItem("idToken");
  window.localStorage.setItem("codeVerifier", null);
  window.localStorage.setItem("idToken", null);
  window.localStorage.setItem("sid", null);

  try {
    id_token_hint = JSON.parse(id_token_hint);
  } catch (error) {
    console.log(error);
  }

  if (id_token_hint) {
    console.log('@@@@@@@@@@@@@@@@@@@ AUTH LOGOUT @@@@@@@@@@@@@@@@@@@', `${egiszUrlLogout}&id_token_hint=${id_token_hint}`)
    window.location.href = `${egiszUrlLogout}&id_token_hint=${id_token_hint}`;
  }
};

const getAxiosInstance = (
  accessToken,
  refreshTokenPair,
  cbIfRefreshError,
  clearRefreshPromiseStore
) => {
  const Instance = axios.create({
    baseURL: isDev
      ? "https://mkb11-compose-dev.digitalms.ru/"
      : window.location.origin,
  });

  Instance.interceptors.request.use(
    function (config) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
      return config;
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  Instance.interceptors.response.use(null, async function (error) {
    if (error?.response?.status === 401) {
      try {
        const access_token = await refreshTokenPair();
        const delayRetryRequest = new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, error.response.config.retryDelay || 1000);
        });
        error.response.config.headers[
          "Authorization"
        ] = `Bearer ${access_token}`;
        return delayRetryRequest.then(() => axios(error.response.config));
      } catch (error) {
        console.log(error);
        cbIfRefreshError && cbIfRefreshError();
      }
    }
    return Promise.reject(error);
  });

  return Instance;
};

const safeExec = (func, fieldName, defaultValue) => {
  try {
    return func(fieldName, defaultValue);
  } catch (error) {
    console.log(error);
    window.localStorage.setItem(fieldName, "");
  }
};

const getDecodedToken = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const { exp } = decoded;
    return exp > (new Date().getTime() + 1) / 1000 ? decoded : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const useAuth = () => {
  const [accessToken, setAccessToken] = safeExec(
    useLocalStorage,
    "accessToken",
    null
  );
  const [refreshToken, setRefreshToken] = safeExec(
    useLocalStorage,
    "refreshToken",
    null
  );
  const [codeVerifier, setCodeVerifier] = safeExec(
    useLocalStorage,
    "codeVerifier",
    null
  );
  const [idToken, setIdToken] = safeExec(useLocalStorage, "idToken", null);
  const [alreadyUsedCode, setAlreadyUsedCode] = safeExec(
    useLocalStorage,
    "alreadyUsedCode",
    null
  );
  const [alreadyUsedMisToken, setAlreadyUsedMisToken] = safeExec(
    useLocalStorage,
    "alreadyUsedMisToken",
    null
  );

  const [axiosInstance, setAxiosInstance] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [code, setCode] = useState(null);
  const [misToken, setMisToken] = useState(null);
  const refreshingInProgress = useRef(null);
  const errRequestStore = useRef([]);

  // useEffect(() => {
  //   const interval = setInterval(
  //     () => {
  //       const refresh = window.localStorage.getItem("refreshToken");
  //       if (!isEmpty(refreshToken)) {
  //         getRefreshToken(refresh)
  //           .then(({ data }) => {
  //             window.localStorage.setItem("accessToken", data.accessToken);
  //             window.localStorage.setItem("refreshToken", data.accessToken);
  //           })
  //           .catch((error) => {});
  //         getRefreshTokenWrapper(refreshToken);
  //       }
  //     },
  //     process.env.REACT_APP_CUSTOM_TOKEN_TTL
  //       ? process.env.REACT_APP_CUSTOM_TOKEN_TTL
  //       : 280000
  //   );

  //   return () => clearInterval(interval);
  // }, []);

  const processSavedTokens = (accessToken, refreshToken) => {
    const decodedAccessToken = getDecodedToken(accessToken);
    const decodedRefreshToken = getDecodedToken(refreshToken);

    if (decodedAccessToken && decodedRefreshToken) {
      setUserInfo(decodedAccessToken);
      const axiosInstance = getAxiosInstance(
        accessToken,
        () => getRefreshTokenWrapper(refreshToken),
        resetTokens
      );
      // apiSingleton.Session = axiosInstance;
      setAxiosInstance(() => axiosInstance);
    }
    if (decodedAccessToken && !decodedRefreshToken) {
      setUserInfo(decodedAccessToken);
      setRefreshToken(null);
      const axiosInstance = getAxiosInstance(accessToken, resetTokens);
      // apiSingleton.Session = axiosInstance;
      setAxiosInstance(() => axiosInstance);
    }

    if (!decodedAccessToken && decodedRefreshToken) {
      setUserInfo(null);
      setAccessToken(null);
      getRefreshTokenWrapper(refreshToken);
    }
    if (!decodedAccessToken && !decodedRefreshToken) {
      resetTokens();
      setUserInfo(null);
      setAxiosInstance(null);
    }
  };

  const resetTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
    // setIdToken(null);
    // setCodeVerifier(null)
  };

  useEffect(() => {
    const params = new URLSearchParams(document.location.search);
    const authCode = params.get("code") ?? "";
    const misToken = params.get("token") ?? "";
    const sidToken = params.get("sid") ?? "";

    if (misToken) {
      setMisToken(misToken);
      setAlreadyUsedMisToken(misToken);
      if(sidToken) window.localStorage.setItem('sid', sidToken)
    } else if (authCode && authCode !== alreadyUsedCode) {
      setCode(authCode);
      setAlreadyUsedCode(authCode);
    } else processSavedTokens(accessToken, refreshToken);
  }, []);

  async function getRefreshTokenWrapper(refreshToken) {
    try {
      const result = await getRefreshToken(refreshToken);
      if (result.status === 200) {
        const { data } = result;
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setIdToken(data.id_token);
        return data.access_token;
      } else resetTokens();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (misToken) {
      axios
        .get("https://mkb11-compose-dev.digitalms.ru/v1/token/validation", {
          headers: {
            Authorization: `Bearer ${misToken}`,
          },
        })
        .then(() => {
          setAccessToken(misToken);
          setRefreshToken(null);
        })
        .catch(console.log);
    }
  }, [misToken]);

  useEffect(() => {
    if (code && codeVerifier) {
      getTokenPair(
        code,
        codeVerifier,
        // "https://mkb11-compose-dev.digitalms.ru/"
        getURL()
      )
        .then((data) => {
          if (!isEmpty(data) && data.status === 200) {
            setAccessToken(data.data.access_token);
            setRefreshToken(data.data.refresh_token);
            setIdToken(data.data.id_token);
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => setAlreadyUsedCode(code));
    } else {
      console.log("No code");
    }
  }, [code]);

  useEffect(() => {
    processSavedTokens(accessToken, refreshToken);
  }, [accessToken, refreshToken]);

  useEffect(() => {
    // console.log(userInfo);
    if (axiosInstance) {
      apiSingleton.Session = axiosInstance;
    } else {
      const config = {
        // baseURL: process.env.REACT_APP_DEV_URL,
        baseURL: getURL(),
      };
      apiSingleton.Session = axios.create(config);
    }
  }, [axiosInstance]);

  return { userInfo, resetTokens, signIn, logOut, axiosInstance };
};
