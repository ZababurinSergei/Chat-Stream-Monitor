let covert = {}
covert = {}

export let pixelToVH = function (value) {
  // console.log('pixelToVH', value, `=>`, `${(100 * value) / window.innerHeight}vh`)
  return ((100 * value) / window.innerHeight)
}

export let pixelToVW = function (value) {
  // console.log('pixelToVW', value, `=>`, `${(100 * value) / window.innerWidth}vw`)
  return ((100 * value) / window.innerWidth)
}

export let size = function (value, width) {
  // console.log('pixelToVW', value, `=>`, `${(100 * value) / window.innerWidth}vw`)
  return ((100 * value) / width)
}

export let vhToPixel = function (value) {
  // console.log('vhToPixel', value, `=>`, `${(window.innerHeight * value) / 100}px`)
  return ((window.innerHeight * value) / 100)
}

export let vwToPixel = function (value) {
  // console.log('vwToPixel', value, `=>`, `${(window.innerWidth * value) / 100}px`)
  return ((window.innerWidth * value) / 100)
}

export let clearnPx = function (value) {
  // console.log('clearnPx', value, `=>`, `${value}`)
  value = value.substr(0, value.length - 2)
  return value
}

export default {
  "author": "Zababurin Sergey",
  "license": `
    Copyright 2020 The Zababurin Authors.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.`,
  "bugs": {
    "url": "https://github.com/zababurinsv/template/issues",
    "mail": "s.zababurin.v@gmail.com"
  }
}
