import WAWebJS, { Client, LocalAuth } from "whatsapp-web.js";

export default class WhatsappClient {
    MODE_INITIALIZING = 1;
    MODE_READY = 2;
    public client: Client;
    public mode: number;
    public isReady: boolean = false;
    public constructor(sessionName: string) {
        this.mode = this.MODE_INITIALIZING;
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName })
        });
        client.on("ready", () => {
            this.mode = this.MODE_READY;
        })
        client.on("qr", (value: string) => {
            console.log(`Scan the following code with your phone:\n${value}`);
        })
        client.initialize();
        this.client = client;
    }

    public async destroy() {
        const state = await this.client.getState();
        switch (state) {
            case WAWebJS.WAState.CONNECTED:
                await this.client.logout();
            default:
                await this.client.destroy();
        }
    }
}