import axios from "axios";
import { isEmpty } from "../isEmpty/index";

const singleton = Symbol();
const singletonEnforcer = Symbol();

function readCookie(name) {
  const match = document.cookie.match(
    new RegExp("(^|;\\s*)(" + name + ")=([^;]*)")
  );
  return match ? decodeURIComponent(match[3]) : null;
}

class ApiService {
  static api = {};
  set backend(data) {
    ApiService.api = data;
  }
  set Session(axiosInstance) {
    this.session = axiosInstance;
  }
  constructor(enforcer) {
    if (enforcer !== singletonEnforcer) {
      throw new Error("Cannot construct singleton");
    }

    // const config =
    //   window.location.hostname === "localhost"
    //     ? {
    //         // baseURL: process.env.REACT_APP_DEV_URL,
    //         baseURL: "https://mkb11-compose-dev.digitalms.ru",
    //       }
    //     : {};

    // this.session = axios.create(config);
  }
  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new ApiService(singletonEnforcer);
    }

    return this[singleton];
  }
  get = (url, extras) => {
    // const accessToken = getToken();

    let language = "";
    let requestUrl = "";

    const releaseGroup = window.localStorage.getItem("releaseGroup");
    const releaseId = window.localStorage.getItem("releaseId");
    const releaseLang = window.localStorage.getItem("releaseLang");

    if (
      !isEmpty(releaseGroup) &&
      !isEmpty(releaseId) &&
      !isEmpty(releaseLang)
    ) {
      language = releaseLang;
      if (extras?.headers["Accept-Language"]) {
          extras.headers["Accept-Language"] = language;
      }
      if (url.includes(`${process.env.PUBLIC_URL}`)) {
        requestUrl = url.replace(`${process.env.PUBLIC_URL}`, "");
      }

      if (requestUrl.startsWith("/")) {
        requestUrl = requestUrl.replace("/", "");
      }
      requestUrl = requestUrl.replace(ApiService.api.Release, releaseId);

      if (releaseGroup === "testing") {
        requestUrl = `/testing/${requestUrl}`;
      }
    } else {
      language = ApiService.api.Lang;
      requestUrl = url.includes(`${process.env.PUBLIC_URL}`)
        ? `${url}`
        : `${process.env.PUBLIC_URL}${url}`;
    }

    console.log()
    return this.session.get(requestUrl, {
      headers: {
        // Authorization: `Bearer ${accessToken}`,
        ...extras?.headers,
        "Accept-Language": language,
      },
    });
  };
  post = (url, data, extras) => {
    try {

      let language = "";
      let requestUrl = "";

      const releaseGroup = window.localStorage.getItem("releaseGroup");
      const releaseId = window.localStorage.getItem("releaseId");
      const releaseLang = window.localStorage.getItem("releaseLang");

      if (
        !isEmpty(releaseGroup) &&
        !isEmpty(releaseId) &&
        !isEmpty(releaseLang)
      ) {
        language = releaseLang;
        if (extras?.headers["Accept-Language"]) {
          extras.headers["Accept-Language"] = language;
        }

        if (url.includes(`${process.env.PUBLIC_URL}`)) {
          requestUrl = url.replace(`${process.env.PUBLIC_URL}`, "");
        }

        if (requestUrl.startsWith("/")) {
          requestUrl = requestUrl.replace("/", "");
        }
        requestUrl = requestUrl.replace(ApiService.api.Release, releaseId);

        if (releaseGroup === "testing") {
          requestUrl = `/testing/${requestUrl}`;
        }
      } else {
        language = ApiService.api.Lang;
        requestUrl = url.includes(`${process.env.PUBLIC_URL}`)
          ? `${url}`
          : `${process.env.PUBLIC_URL}${url}`;
      }

      // const accessToken = getToken();
      return this.session.post(requestUrl,
        data,
        {
          headers: {
            // Authorization: `Bearer ${accessToken}`,
            "Accept-Language": language,
            ...extras?.headers,
          },
        }
      );
    } catch (e) {
      console.error("error in API", e);
      return [];
    }
  };
  put = (...params) => {
    return this.session.put(...params, {
      headers: {
        "Accept-Language": ApiService.api.Lang,
      },
    });
  };
  patch = (...params) => {
    return this.session.patch(...params, {
      headers: {
        "Accept-Language": ApiService.api.Lang,
      },
    });
  };
  remove = (...params) => {
    return this.session.delete(...params, {
      headers: {
        "Accept-Language": ApiService.api.Lang,
      },
    });
  };
}

export const getApi = () => {
  const {
    api: { current: api },
  } = JSON.parse(localStorage.getItem("mkb_api"));
  return api;
};

export const getToken = () => {
  const accessToken = localStorage.getItem("accessToken");
  return accessToken.length ? accessToken.replaceAll('"', "") : "";
};

export default ApiService.instance;
