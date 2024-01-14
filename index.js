const { Client, LocalAuth } = require("whatsapp-web.js");
const Fastify = require("fastify");
const qrcode = require("qrcode-terminal");

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "default" }),
});
client.on("qr", (qr) => {
    console.log("Please scan this QR Code to connect");
    qrcode.generate(qr);
});
client.on("ready", () => {
    console.log("Client is ready!");
});

const fastify = Fastify({
    logger: true,
});

// Declare a route
fastify.get("/", async function handler(request, reply) {
    return { hello: "world" };
});

(async () => {
    client.initialize();
    await fastify.listen({ port: 3000 });
})();
