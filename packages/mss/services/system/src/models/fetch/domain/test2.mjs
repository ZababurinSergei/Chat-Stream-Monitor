const headers = {
  "Content-Type": "application/json:charset=utf-8"
};
const methodPOST = "POST";
const URL_REGION_LIST = "http://127.0.0.1:3333/v1/region/list";

const getAllRegion = async () =>
  fetch(URL_REGION_LIST, {
    method: methodPOST,
    headers
  })
    .then((response) => response.json())
    .then((data) => data)
    .catch((err) => console.error(err));

const result = async () => {
  const res = await getAllRegion();
  console.log("🚀 ~ result ~ res:", res);
};

result();
