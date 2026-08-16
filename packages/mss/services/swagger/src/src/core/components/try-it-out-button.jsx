import React from "react"
import PropTypes from "prop-types"
import { getStore } from '../'

export default class TryItOutButton extends React.Component {

  static propTypes = {
    pathMethod: PropTypes.array,
    onTryoutClick: PropTypes.func,
    onResetClick: PropTypes.func,
    onCancelClick: PropTypes.func,
    enabled: PropTypes.bool, // Try it out is enabled, ie: the user has access to the form
    hasUserEditedBody: PropTypes.bool, // Try it out is enabled, ie: the user has access to the form
    isOAS3: PropTypes.bool, // Try it out is enabled, ie: the user has access to the form
  }

  static defaultProps = {
    pathMethod: [],
    onTryoutClick: Function.prototype,
    onCancelClick: Function.prototype,
    onResetClick: Function.prototype,
    enabled: false,
    hasUserEditedBody: false,
    isOAS3: false,
  }

  render() {
    const { onTryoutClick, onCancelClick, onResetClick, enabled, hasUserEditedBody, isOAS3 } = this.props

    const showReset = isOAS3 && hasUserEditedBody
    const api = getStore().api

    api.tryItOutButton[`${this.props.pathMethod[0]}`] = {
      state: {
        enabled: enabled,
        showReset: showReset
      },
      method: this.props.pathMethod[1],
      path: this.props.pathMethod[0]
    }

    if(showReset) {
      api.tryItOutButton[`${this.props.pathMethod[0]}`][`${this.props.pathMethod[1]}`].onResetClick.swagger = onResetClick
      api.tryItOutButton[`${this.props.pathMethod[0]}`][`${this.props.pathMethod[1]}`].toggleShown.swagger = onCancelClick
    } else {
      api.tryItOutButton[`${this.props.pathMethod[0]}`][`${this.props.pathMethod[1]}`].toggleShown.swagger = onTryoutClick
    }

    return (
      <div className={showReset ? "try-out btn-group" : "try-out"}>
        {
          enabled ? <button className="btn try-out__btn cancel" onClick={ onCancelClick }>Cancel</button>
                  : <button className="btn try-out__btn" onClick={ onTryoutClick }>Try it out </button>

        }
        {
          showReset && <button className="btn try-out__btn reset" onClick={ onResetClick }>Reset</button>
        }
      </div>
    )
  }
}
