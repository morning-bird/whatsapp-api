import 'dotenv/config';
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import WhatsappClient from './libs/WhatsappClient';
import { WAState } from 'whatsapp-web.js';
import QRCode from "qrcode";
import { WhatsappSessionStatus } from './structures/enum';

const clients: Map<string, WhatsappClient> = new Map;

const fastify = Fastify({
    logger: true,
});
fastify.addHook("onRequest", (req: FastifyRequest<{
    Params: { session: string }
}>, res: FastifyReply, done) => {
    let error;
    if (req.routerPath && (req.routerPath.startsWith('/:session/'))) {
        const sessionName = req.params.session;
        const client = clients.get(sessionName);
        if (!client) {
            error = new Error("client not found")
        } else if (client.getState() !== WhatsappSessionStatus.WORKING) {
            error = new Error(`client is in ${client.getState()}`)
        }
    }
    done(error)
})

const getChatId = async (req: FastifyRequest<{
    Body: {
        chatId?: string,
        number?: string
    }
}>, client: WhatsappClient) => {
    // must have at least 1
    if (!req.body.chatId && !req.body.number) {
        return null;
    }
    let chatId;
    if (req.body.chatId) {
        chatId = req.body.chatId
    } else {
        const _chatId = await client.client.getNumberId(req.body.number!);
        chatId = _chatId ? `${_chatId.user}@${_chatId.server}` : null;
    }
    return chatId;
}

fastify.post("/sessions/:session/stop", async (req: FastifyRequest<{
    Params: { session: string }
}>, res) => {
    const sessionName = req.params.session.toLowerCase();
    let client = clients.get(sessionName);
    if (client) {
        await client.destroy();
        clients.delete(sessionName)
    }
    return {};
})

fastify.post("/sessions/:session/start", async (req: FastifyRequest<{
    Params: { session: string }
}>, res) => {
    const sessionName = req.params.session.toLowerCase();
    let client = clients.get(sessionName);
    if (!client) {
        client = new WhatsappClient(sessionName);
        clients.set(sessionName, client);
    }
    return {};
})

fastify.get("/:session/auth/qr", async (req: FastifyRequest<{
    Params: { session: string }
}>, res) => {
    const sessionName = req.params.session.toLowerCase();
    let client = clients.get(sessionName);
    if (!client) {
        return res.callNotFound()
    }
    const state = client.getState();
    if (state === WhatsappSessionStatus.SCAN_QR_CODE && client.qrValue) {
        const buffer = await QRCode.toBuffer(client.qrValue)
        res.type("image/png")
        return res.send(buffer)
    }
    return {
        result: {
            state: state
        }
    };
})

fastify.get("/sessions/:session/me", async (req: FastifyRequest<{
    Params: { session: string }
}>, res) => {
    const sessionName = req.params.session.toLowerCase();
    const client = clients.get(sessionName);
    if (!client) return res.callNotFound();
    return {
        result: {
            state: client.getState(),
            info: client.client.info
        }
    }
})

fastify.post("/:session/messages/send-text", async (req: FastifyRequest<{
    Params: { session: string },
    Body: {
        chatId?: string,
        number?: string,
        text: string,
    }
}>, res) => {
    const client = clients.get(req.params.session)!;
    // cek if number is valid
    const chatId = await getChatId(req, client);
    if (!chatId) {
        return res.status(400).send({
            error: 'chatId or number is invalid or empty!'
        })
    }
    await client.sendText(chatId, req.body.text);
    return {}
})

fastify.post("/:session/messages/send-poll", async (req: FastifyRequest<{
    Params: { session: string },
    Body: {
        chatId?: string,
        number?: string,
        poll: {
            name: string,
            options: string[],
            multipleAnswers: boolean
        }
    }
}>, res) => {
    const client = clients.get(req.params.session)!;
    // cek if number is valid
    const chatId = await getChatId(req, client);
    if (!chatId) {
        return res.status(400).send({
            error: 'chatId or number is invalid or empty!'
        })
    }
    await client.sendPoll(chatId, req.body.poll);
    return {}
})


fastify.get("/:session/messages", async (req: FastifyRequest<{
    Params: { session: string }
}>, res) => {
    const client = clients.get(req.params.session)!;
    const chats = await client.client.getChats();
    return {
        result: chats
    }
})

fastify.get("/:session/messages/:chatId", async (req: FastifyRequest<{
    Params: { session: string, chatId: string },
    Querystring: {
        limit: number
    }
}>, res) => {
    // default 10
    let limit = req.query.limit ? req.query.limit : 10;
    const client = clients.get(req.params.session)!;
    const chat = await client.client.getChatById(req.params.chatId)
    const messages = await chat.fetchMessages({
        limit: limit
    })
    return {
        result: messages
    }
})

fastify.get("/:session/groups", async (req: FastifyRequest<{
    Params: { session: string }
}>, res) => {
    const client = clients.get(req.params.session)!;
    const chats = await client.client.getChats();
    const groups = chats.filter(chat => chat.isGroup);
    return {
        result: groups
    }
})

// Declare a route
fastify.get("/", async (req, res) => {
    return { hello: "test" };
});

(async () => {
    fastify.listen({ port: process.env.PORT ? +process.env.PORT : 3000 });
})();
