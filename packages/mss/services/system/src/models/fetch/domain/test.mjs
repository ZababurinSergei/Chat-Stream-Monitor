const headers = {
  "Content-Type": "application/json:charset=utf-8"
};

const methodPOST = "POST";
const URL_REGION_LIST = "http://127.0.0.1:3333/v1/region/list";
const URL_REGION_COUNT = "http://127.0.0.1:3333/v1/region/count";

async function getAllRegion() {
  try {
    const response = await fetch(URL_REGION_LIST, {
      method: methodPOST,
      headers
    });
    const data = await response.json();
    console.log("getAllRegion", data);
  } catch (err) {
    console.log(err);
  }
}

getAllRegion();

async function getAllRegionWithPage() {
  try {
    const response = await fetch(URL_REGION_LIST, {
      method: methodPOST,
      headers,
      body: JSON.stringify({
        page: {
          limit: 1,
          offset: 1
        }
      })
    });
    const data = await response.json();
    console.log("getAllRegionWithPage", data);
  } catch (err) {
    console.log(err);
  }
}

getAllRegionWithPage();

async function countAllRegions() {
  try {
    const response = await fetch(URL_REGION_COUNT, {
      method: methodPOST,
      headers
    });
    const data = await response.json();
    console.log("countAllRegions", data);
  } catch (err) {
    console.log(err);
  }
}

countAllRegions();
