import { Component } from './base-nk/index.mjs';
import { LoadTracker } from './base-nk/this/loadTracker.mjs';

export { Component, LoadTracker }
export const initComponent = async function (componentNames = []){
    try {
        componentNames.forEach(componentName => { import(`./${componentName}/index.mjs`) })
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

export default {
    description: "Компоненты"
}