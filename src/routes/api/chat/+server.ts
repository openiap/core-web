import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
let apikey = OPENAI_API_KEY;

if (process.env.OPENAI_API_KEY != null) {
    apikey = process.env.OPENAI_API_KEY;
}
const openai = new OpenAI({ apiKey: apikey });

export const POST = async ({ request }) => {
    const { messages } = await request.json(); // [{role:'user', content:'...'}, ...]

    // Ask OpenAI to stream
    const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',            // pick your model
        messages,
        stream: true
    }); // async iterable of chunks

    const encoder = new TextEncoder();

    const body = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const delta = chunk.choices?.[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(delta));
                }
            } catch (err) {
                controller.error(err);
                return;
            }
            controller.close();
        }
    });

    return new Response(body, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-cache'
        }
    });
};
