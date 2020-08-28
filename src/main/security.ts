import {app, shell, WebContents} from "electron";
import {URL} from "url";

export default class SecurityConfig {
    static origins = [
        'https://localhost:5001',
        'https://google.com',
    ]

    static onWebContentsCreated(event: Event, contents: WebContents) {
        contents.on('will-navigate', async (event, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl)

            if (SecurityConfig.origins.indexOf(parsedUrl.origin) !== -1) {

            } else {
                event.preventDefault()
                await shell.openExternal(navigationUrl)
            }
        })
        contents.on('new-window', async (event, navigationUrl) => {
            // In this example, we'll ask the operating system
            // to open this event's url in the default browser.
            event.preventDefault()

            await shell.openExternal(navigationUrl)
        })
    }
}
