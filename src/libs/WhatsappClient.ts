import WAWebJS, { Client, Events, LocalAuth, Poll, WAState } from "whatsapp-web.js";
import { WhatsappSessionStatus } from "../structures/enum";

export default class WhatsappClient {
    private status: WhatsappSessionStatus;
    public client: Client;
    public webhookUrl?: string;
    public isReady: boolean = false;
    public qrValue?: string;

    public constructor(sessionName: string, webhookUrl?: string) {
        if (webhookUrl) {
            this.webhookUrl = webhookUrl;
        }
        this.status = WhatsappSessionStatus.STARTING;
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: {
                args: ['--no-sandbox'],
            }
        });
        client.on(Events.READY, () => {
            console.debug(`${sessionName} is ready!`)
            this.status = WhatsappSessionStatus.WORKING
            this.sendToWebhook({
                event: Events.READY,
                state: WhatsappSessionStatus.WORKING
            })
        })
        client.on(Events.STATE_CHANGED, (state) => {
            switch (state) {
                case WAState.CONFLICT:
                    this.status = WhatsappSessionStatus.FAILED;
                    break;
            }
            this.sendToWebhook({
                event: Events.STATE_CHANGED,
                result: state
            })
        })
        client.on(Events.MESSAGE_RECEIVED, (message) => {
            this.sendToWebhook({
                event: Events.MESSAGE_RECEIVED,
                result: {}
            })
        })
        client.on(Events.QR_RECEIVED, (value: string) => {
            this.status = WhatsappSessionStatus.SCAN_QR_CODE;
            this.qrValue = value;
            this.sendToWebhook({
                event: Events.QR_RECEIVED,
                state: WhatsappSessionStatus.SCAN_QR_CODE,
                result: value
            })
            console.log(`Scan the following code with your phone:\n${value}`);
        })
        client.initialize();
        this.client = client;
    }

    private isValidChatId(chatId: string) {
        return chatId.indexOf("@") > 0;
    }

    public async sendText(chatId: string, message: string) {
        if (!this.isValidChatId(chatId)) return;
        return this.client.sendMessage(chatId, message)

    }

    public async sendPoll(chatId: string, pollPayload: any) {
        if (!this.isValidChatId(chatId)) return;
        const isMultipleChoice = pollPayload.multipleAnswers;
        let poll = new Poll(pollPayload.name, pollPayload.options);
        if (isMultipleChoice) {
            poll.options.allowMultipleAnswers = isMultipleChoice;
        }
        return this.client.sendMessage(chatId, poll);
    }

    private async sendToWebhook(object: any) {
        if (this.webhookUrl) {
            try {
                await fetch(this.webhookUrl, {
                    method: 'POST', headers: {
                        'Content-Type': 'application/json'
                    }, body: JSON.stringify(object)
                });
            } catch (exc) {
                console.error("Error at sendToWebhook", exc)
            }
        }
    }

    public getState() {
        return this.status;
    }

    public async destroy() {
        const state = await this.client.getState();
        switch (state) {
            case WAWebJS.WAState.CONNECTED:
                await this.client.logout();
            default:
                this.client.removeAllListeners();
                await this.client.destroy();
        }
    }
}