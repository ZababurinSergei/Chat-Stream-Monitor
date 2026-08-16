import './components/chat-manager/index.mjs'
import './components/chat-interface/index.mjs'
import './components/group-manager/index.mjs'
import './components/peer-connection/index.mjs'
import './components/remote-control/index.mjs'
import {test} from './components/tests/src/index.mjs'

const container = document.body.querySelector('.container')
container.attachShadow({mode: "open"})

/**
 <chat-interface slot="chat-interface" id="main-chat"></chat-interface>
 <peer-connection slot="peer-connection" id="peer-connection"></peer-connection>
 <chat-manager slot="chat-manager" id="chat-manager"></chat-manager>
 <group-manager slot="group-manager" id="group-manager" data-no-render></group-manager>
 */

const chatInterface = document.createElement('chat-interface')
chatInterface.setAttribute('id', 'main-chat')
chatInterface.setAttribute('slot', 'chat-interface')

const peerConnection = document.createElement('peer-connection')
chatInterface.setAttribute('id', 'peer-connection')
chatInterface.setAttribute('slot', 'peer-connection')

const chatManager = document.createElement('chat-manager')
chatInterface.setAttribute('id', 'chat-manager')
chatInterface.setAttribute('slot', 'chat-manager')

const groupManager = document.createElement('group-manager')
chatInterface.setAttribute('id', 'group-manager')
chatInterface.setAttribute('slot', 'group-manager')

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

window.onload = async function () {
    test({
        path: '/tests/index.mjs'
    }).catch(e => {
        console.log('error devtool', e)
    })
}