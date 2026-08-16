import React, { Component } from "react"
import PropTypes from "prop-types"
import {getStore} from '../'

export default class Clear extends Component {

  onClick =() => {
    let { specActions, path, method } = this.props
    specActions.clearResponse( path, method )
    specActions.clearRequest( path, method )
  }

  render() {
    const api = getStore().api

    api.clear[`${this.props.path}`] = {
      method: this.props.method,
      path: this.props.path
    }

    api.clear[`${this.props.path}`][`${this.props.method}`].onClick.swagger = this.onClick

    return (
      <button className="btn btn-clear opblock-control__btn" onClick={ api.clear[`${this.props.path}`][`${this.props.method}`].onClick.service }>
        Clear
      </button>
    )
  }

  static propTypes = {
    specActions: PropTypes.object.isRequired,
    path: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
  }
}
