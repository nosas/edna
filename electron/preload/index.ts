const { contextBridge } = require('electron')
import darkMode from "./theme-mode"
import { isMac, isWindows, isLinux } from "../detect-platform"
import { ipcRenderer } from "electron"
import { WINDOW_CLOSE_EVENT, KEYMAP_CHANGE_EVENT, OPEN_SETTINGS_EVENT } from "../constants"
import CONFIG from "../config"

contextBridge.exposeInMainWorld("platform", {
    isMac,
    isWindows,
    isLinux,
})
contextBridge.exposeInMainWorld('darkMode', darkMode)

contextBridge.exposeInMainWorld("heynote", {
    quit() {
        console.log("quitting")
        //ipcRenderer.invoke("app_quit")
    },

    onWindowClose(callback) {
        ipcRenderer.on(WINDOW_CLOSE_EVENT, callback)
    },

    onOpenSettings(callback) {
        ipcRenderer.on(OPEN_SETTINGS_EVENT, callback)
    },

    buffer: {
        async load() {
            return await ipcRenderer.invoke("buffer-content:load")
        },
    
        async save(content) {
            return await ipcRenderer.invoke("buffer-content:save", content)
        },

        async saveAndQuit(content) {
            return await ipcRenderer.invoke("buffer-content:saveAndQuit", content)
        },
    },

    keymap: {
        set(keymap) {
            ipcRenderer.invoke("keymap:set", keymap);
        },
        initial: CONFIG.get("keymap", "default"),
        onKeymapChange(callback) {
            ipcRenderer.on(KEYMAP_CHANGE_EVENT, (event, keymap) => callback(keymap))
        },
    },
})


function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
    return new Promise((resolve) => {
        if (condition.includes(document.readyState)) {
            resolve(true)
        } else {
            document.addEventListener('readystatechange', () => {
                if (condition.includes(document.readyState)) {
                    resolve(true)
                }
            })
        }
    })
}

const safeDOM = {
    append(parent: HTMLElement, child: HTMLElement) {
        if (!Array.from(parent.children).find(e => e === child)) {
            return parent.appendChild(child)
        }
    },
    remove(parent: HTMLElement, child: HTMLElement) {
        if (Array.from(parent.children).find(e => e === child)) {
            return parent.removeChild(child)
        }
    },
}


function useLoading() {
    const className = `loaders-css__square-spin`
    const styleContent = `
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  z-index: 9;
}
@media (prefers-color-scheme: dark) {
    .${className} > div {
        background: #fff;
    }
    .app-loading-wrap {
        background: #262B37
    }
}
    `
    const oStyle = document.createElement('style')
    const oDiv = document.createElement('div')

    oStyle.id = 'app-loading-style'
    oStyle.innerHTML = styleContent
    oDiv.className = 'app-loading-wrap'
    oDiv.innerHTML = `<div class="${className}"></div>`

    return {
        appendLoading() {
            safeDOM.append(document.head, oStyle)
            safeDOM.append(document.body, oDiv)
        },
        removeLoading() {
            safeDOM.remove(document.head, oStyle)
            safeDOM.remove(document.body, oDiv)
        },
    }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
    ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
