const { OpenAI } = require("openai");
const readlineSync = require("readline-sync");
require("dotenv").config();

let APIcall = async () => {
    const openai = new OpenAI(process.env.OPENAI_SECRET_KEY);
    const chatHistory = [];

    do {
        const user_input = readlineSync.question("Enter your input: ");
        const messageList = chatHistory.map(([input_text, completion_text]) => ({
            role: input_text === "user" ? "ChatGPT" : "user",
            content: input_text
        }));
        messageList.push({ role: "user", content: user_input });

        try {
            const GPTOutput = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messageList
            });

            if (GPTOutput && GPTOutput.choices && GPTOutput.choices[0] && GPTOutput.choices[0].message) {
                const output_text = GPTOutput.choices[0].message.content;
                console.log(output_text);
                chatHistory.push([user_input, output_text]);
            } else {
                console.error("Unexpected API response:", GPTOutput);
            }

        } catch (err) {
            if (err.response) {
                console.log(err.response.status);
                console.log(err.response.data);
            } else {
                console.log(err.message);
            }
        }
    } while (readlineSync.question("\nYou Want more Results? (Y/N)").toUpperCase() === "Y");
};

APIcall();
