const Koa = require('koa');
const Router = require('koa-router');
const { RouterContext } = require('koa-router');
const bodyParser = require('koa-bodyparser');
const OpenAI = require('openai');
const logger = require('koa-logger');
const json = require('koa-json');
const cors = require('@koa/cors'); 

// const cors = require('@koa/cors');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: "sk-XXXXXXXXX",
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const ai2msg = async (query: string) => {
    try {
        console.log('Processing message:', query);
        const completion = await openai.chat.completions.create({
            model: "qwen-max",
            messages: [
                {
                    role: "system",
                    content: "You are a professional blogger. Provide clear, concise, and natural responses. Avoid using special formatting or mathematical notation unless specifically requested."
                },
                {
                    role: "user",
                    content: query
                }
            ]
        });
        console.log('AI Response:', completion.choices[0].message.content);
        return completion.choices[0].message.content;
    } catch (error) {
        console.log(`Error message: ${error}`);
        throw error;
    }
};

const app = new Koa();
const router = new Router();

router.post('/', async (ctx: typeof RouterContext, next: any) => {
    console.log('Received request body:', ctx.request.body);
    const body = ctx.request.body;
    try {
        const aicontent = await ai2msg(body.msg);
        ctx.body = { 'ai': aicontent };
        console.log('Sending response:', ctx.body);
    } catch (error) {
        console.log('Error in route handler:', error);
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
    }
});

app.use(logger());
app.use(json());
app.use(bodyParser());
app.use(cors());
app.use(router.routes());

// Start server
const PORT = 10888;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
