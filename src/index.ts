import 'dotenv/config';

import { Client, LocalAuth } from "whatsapp-web.js";
import Fastify, { FastifyRequest } from "fastify";
import QRCode from "qrcode-terminal";
const clients: Map<string, Client> = new Map;
// const client = new Client({
//     authStrategy: new LocalAuth({ clientId: "default" }),
// });
// client.on("qr", (qr) => {
//     console.log("Please scan this QR Code to connect");
//     // QRCode.generate(qr);
// });
// client.on("ready", () => {
//     console.log("Client is ready!");
// });

const fastify = Fastify({
    logger: true,
});

fastify.post("/sessions/:name/start", async (req: FastifyRequest<{
    Params: { name: string }
}>, res) => {
    const sessionName = req.params.name.toLowerCase();
    let client = clients.get(sessionName);
    if (!client) {
        client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName })
        })
        client.on("qr", () => {
            console.log(`Scan this qrcode to connect with session ${sessionName}`)
        })
        client.on("ready", () => {
            console.log("Client is ready")
        })
        client.initialize();
    } else {
        const state = await client.getState();
        console.log(state)
    }
    return { hello: "test" };
})

// Declare a route
fastify.get("/", async (req, res) => {
    return { hello: "test" };
});

(async () => {
    fastify.listen({ port: process.env.PORT ? +process.env.PORT : 3000 });
})();
