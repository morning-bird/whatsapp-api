import 'dotenv/config';
import Fastify, { FastifyRequest } from "fastify";
import WhatsappClient from './libs/WhatsappClient';
const clients: Map<string, WhatsappClient> = new Map;

const fastify = Fastify({
    logger: true,
});

fastify.post("/sessions/:name/stop", async (req: FastifyRequest<{
    Params: { name: string }
}>, res) => {
    const sessionName = req.params.name.toLowerCase();
    let client = clients.get(sessionName);
    if (client) {
        await client.destroy();
        clients.delete(sessionName)
    }
    return {};
})

fastify.post("/sessions/:name/start", async (req: FastifyRequest<{
    Params: { name: string }
}>, res) => {
    const sessionName = req.params.name.toLowerCase();
    let client = clients.get(sessionName);
    if (!client) {
        client = new WhatsappClient(sessionName);
        clients.set(sessionName, client);
    }
    return {};
})

// Declare a route
fastify.get("/", async (req, res) => {
    return { hello: "test" };
});

(async () => {
    fastify.listen({ port: process.env.PORT ? +process.env.PORT : 3000 });
})();
