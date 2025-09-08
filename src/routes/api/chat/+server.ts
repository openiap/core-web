import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
let apikey = OPENAI_API_KEY;

if (process.env.OPENAI_API_KEY != null) {
    apikey = process.env.OPENAI_API_KEY;
}
// console.log("Using OpenAI API Key:", apikey.substring(0, 4) + '...');
const openai = new OpenAI({ apiKey: apikey });

export const POST = async ({ request }) => {
    const { messages } = await request.json(); // [{role:'user', content:'...'}, ...]
    let autheader = request.headers.get('authorization');
    if (autheader) {
        let token = autheader.split(' ')[1];
        if (token && token.length > 10 && token !== apikey) {
            // console.log("access token: " + token.substring(0,4) + '...');
        }
    }

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
                    if (delta) {
                        controller.enqueue(encoder.encode(delta));
                    }
                    
                    // Check if stream is done
                    if (chunk.choices?.[0]?.finish_reason) {
                        break;
                    }
                }
            } catch (err) {
                console.error('Stream error:', err);
                controller.error(err);
                return;
            }
            controller.close();
        }
    });

    return new Response(body, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-cache',
            'x-no-compression': '1',
            'connection': 'keep-alive'
        }
    });
};
