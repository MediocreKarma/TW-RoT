import dotenv from 'dotenv';
import https from 'https'
dotenv.config({path: '.env'});

const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
    }
}

const postData = {
    model: "gpt-4o",
    messages: [
        {role: "system", content: null},
        {role: "user", content: null}
    ]
};

/**
 * Make https request to the openai api and return a promise
 * that will resolve to the generated response.
 * 
 * @param {*} msgHeader The context header for the OpenAI request
 * @param {*} query The actual query
 * @returns A promise that resolves to the response string
 */
export const getOpenAIResponse = async (msgHeader, query) => {
    postData.messages[0].content = msgHeader;
    postData.messages[1].content = query;
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const message = response.choices[0].message.content;
                    resolve(message);
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(JSON.stringify(postData));
        req.end();
    });
}