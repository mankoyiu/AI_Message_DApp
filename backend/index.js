const Koa = require('koa');
const Router = require('koa-router');
const { RouterContext } = require('koa-router');
const bodyParser = require('koa-bodyparser');
const OpenAI = require('openai');
const logger = require('koa-logger');
const json = require('koa-json');
const cors = require('@koa/cors');
const fs = require('fs');
const path = require('path');
// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: "sk-XXXXXXXXX",
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});
// Path to the conversation log file
const LOG_FILE_PATH = path.join(__dirname, 'conversation_log.json');

// Function to read the conversation log
const readConversationLog = () => {
    try {
        if (fs.existsSync(LOG_FILE_PATH)) {
            const data = fs.readFileSync(LOG_FILE_PATH, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error reading conversation log:', error);
        return [];
    }
};

// Function to write to the conversation log
const writeConversationLog = (conversations) => {
    try {
        fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(conversations, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing conversation log:', error);
    }
};

const ai2msg = async (query) => {
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
        const aiResponse = completion.choices[0].message.content;
        console.log('AI Response:', aiResponse);
        return aiResponse;
    }
    catch (error) {
        console.log(`Error message: ${error}`);
        throw error;
    }
};
const app = new Koa();
const router = new Router();

// Route to handle messages and log conversations
router.post('/', async (ctx, next) => {
    console.log('Received request body:', ctx.request.body);
    const body = ctx.request.body;
    try {
        const userMessage = body.msg;
        const aicontent = await ai2msg(userMessage);
        
        // Log the conversation
        const conversations = readConversationLog();
        conversations.push({
            timestamp: new Date().toISOString(),
            user: userMessage,
            ai: aicontent
        });
        writeConversationLog(conversations);
        
        ctx.body = { 'ai': aicontent };
        console.log('Sending response:', ctx.body);
    }
    catch (error) {
        console.log('Error in route handler:', error);
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
    }
});

// Route to get conversation history
router.get('/history', async (ctx, next) => {
    try {
        const conversations = readConversationLog();
        ctx.body = { conversations };
    } catch (error) {
        console.log('Error retrieving conversation history:', error);
        ctx.status = 500;
        ctx.body = { error: 'Failed to retrieve conversation history' };
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
    console.log(`Conversation log will be stored at: ${LOG_FILE_PATH}`);
});
