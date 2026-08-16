import './components/chat-manager/index.mjs'
import './components/chat-interface/index.mjs'
import './components/group-manager/index.mjs'
import './components/peer-connection/index.mjs'
import './components/remote-control/index.mjs'
import {test} from './components/tests/src/index.mjs'

export const app = window.onload = (async () => {
    const isTests = false
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
    peerConnection.setAttribute('id', 'peer-connection')
    peerConnection.setAttribute('slot', 'peer-connection')

    const chatManager = document.createElement('chat-manager')
    chatManager.setAttribute('id', 'chat-manager')
    chatManager.setAttribute('slot', 'chat-manager')

    const groupManager = document.createElement('group-manager')
    groupManager.setAttribute('id', 'group-manager')
    groupManager.setAttribute('slot', 'group-manager')

    chatInterface.connectedCallback()
    peerConnection.connectedCallback()
    chatManager.connectedCallback()
    groupManager.connectedCallback()

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

    document.body.querySelector('.container').appendChild(chatInterface)
    setTimeout(()=> {
        container.shadowRoot.appendChild(doc)
        const componentTests = document.body.querySelector('#tests')
        if(componentTests) {
            componentTests.style.display = 'flex'
        }
    }, 1000)


    if (isTests) {
        test({
            path: '/tests/index.mjs'
        }).catch(e => {
            console.log('error devtool', e)
        })
    }



// Прослушиватель прокрутки
    class ScrollManager {
        constructor() {
            this.scrollTimeout = null;
            this.isScrolling = false;
            this.debounceDelay = 200; // Задержка перед скрытием скроллбара

            this.init();
        }

        init() {
            // Добавляем класс при начале прокрутки
            window.addEventListener('scroll', () => {
                this.handleScrollStart();
            }, { passive: true });

            // Предварительная проверка необходимости скроллбара
            this.checkScrollNecessity();
        }

        handleScrollStart() {
            if (!this.isScrolling) {
                this.isScrolling = true;
                document.documentElement.classList.add('scrolling');
            }

            // Сбрасываем таймер при каждом скролле
            this.clearTimeout();
            this.scrollTimeout = setTimeout(() => {
                this.handleScrollEnd();
            }, this.debounceDelay);
        }

        handleScrollEnd() {
            this.isScrolling = false;
            document.documentElement.classList.remove('scrolling');
        }

        clearTimeout() {
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = null;
            }
        }

        checkScrollNecessity() {
            // Проверяем, нужен ли вообще скроллбар на странице
            const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;

            if (!hasScrollbar) {
                document.documentElement.style.setProperty('--scrollbar-visibility', 'hidden');
                document.documentElement.style.setProperty('--scrollbar-opacity', '0');
            }
        }

        // Метод для принудительного показа/скрытия
        showScrollbar() {
            document.documentElement.classList.add('scrolling');
        }

        hideScrollbar() {
            document.documentElement.classList.remove('scrolling');
        }

        // Обновить настройки
        updateSettings(delay = 1500) {
            this.debounceDelay = delay;
        }
    }

    window.scrollManager = new ScrollManager();


    return {
        components: {
            'peer-connection': {
                id: {
                    'peer-connection': peerConnection
                }
            },
            'chat-manager': {
                id: {
                    'chat-manager': chatManager
                }
            },
            'group-manager': {
                id: {
                    'group-manager': groupManager
                }
            }
        }
    }
})()
