

// const { Client, LocalAuth } = require("whatsapp-web.js");
// const Fastify = require("fastify");
// const qrcode = require("qrcode-terminal");
import { Client, LocalAuth } from "whatsapp-web.js";
import Fastify from "fastify";
import QRCode from "qrcode-terminal";

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "default" }),
});
client.on("qr", (qr) => {
    console.log("Please scan this QR Code to connect");
    // QRCode.generate(qr);
});
client.on("ready", () => {
    console.log("Client is ready!");
});

const fastify = Fastify({
    logger: true,
});

// Declare a route
fastify.get("/", async function handler(request, reply) {
    return { hello: "test" };
});

(async () => {
    client.initialize();
    await fastify.listen({ port: 3001 });
})();
