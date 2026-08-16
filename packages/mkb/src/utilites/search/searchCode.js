
import axios from '@src/utilites/API';
import * as links from './links';
import { URL_CODE_FOUND, URL_LOCALHOST } from './links';

// combination: "NA07.20 & XC16 & XC4L / PB80 & XE47R / PA00 & XE43G"
export async function searchCode(value) {
  try {
    if (value.length >= 3) {
      const { data: response } = await axios.post(`${links.URL_CODE_FOUND}`, {
        combination: value,
      });

      return response;
    } else {
      return [];
    }
  } catch (error) {
    console.log(error);
  }
}
