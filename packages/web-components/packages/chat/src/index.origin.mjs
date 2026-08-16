import './components/chat-manager/index.mjs'
import './components/chat-interface/index.mjs'
import './components/group-manager/index.mjs'
import './components/peer-connection/index.mjs'
import './components/remote-control/index.mjs'

import {test} from './components/tests/src/index.mjs'

window.onload = async function () {
    test({
        path: '/tests/index.mjs'
    }).catch(e => {
        console.log('error devtool', e)
    })
}

const container = document.body.querySelector('.container')
container.attachShadow({mode: "open"})

const doc = document.createElement('div')
const slotRemoteControl = document.createElement('slot')
const slotChatInterface = document.createElement('slot')
const slotPeerConnection = document.createElement('slot')
const slotChatManager = document.createElement('slot')
const slotGroupManager = document.createElement('slot')

slotChatInterface.name = 'chat-interface'
slotRemoteControl.name = 'remote-control'
slotPeerConnection.name = 'peer-connection'
slotChatManager.name = 'chat-manager'
slotGroupManager.name = 'group-manager'
doc.classList.add('container')

doc.appendChild(slotChatInterface)
doc.appendChild(slotPeerConnection)
doc.appendChild(slotRemoteControl)
doc.appendChild(slotChatManager)
doc.appendChild(slotGroupManager)

container.shadowRoot.appendChild(doc)