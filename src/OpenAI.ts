import { Configuration, CreateChatCompletionResponse, OpenAIApi } from "openai";
import fs from 'fs';
import dotenv from 'dotenv';
import { promisify } from 'util';
import logging from 'improved-logging'
import { AxiosResponse } from "axios";
const readFileAsync = promisify(fs.readFile);
dotenv.config();


class OpenAPI {
    openai: OpenAIApi;

    constructor() {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.openai = new OpenAIApi(configuration);
    }

    UNIT_TEST_REQUEST = (framework: string, path: string, code: string) => `Generate a unit test with the ${framework} syntax, containing relevant assertions and required packages in a single 'describe' block, use ES6 imports. Import the functions from ${path} and use them to test the following code snippet: ${code}.`;


    async readFileAsCode(filePath: string) {
        try {
            logging.info(`Reading file: ${filePath}`);
            const data = await readFileAsync(filePath, 'utf8');
            return data;
        } catch (error) {
            throw new Error(`Error reading file: ${error}`);
        }
    }

    async generateUnitTest(framework: string, path: string, code: string) {
        const spinner = (await import('ora')).default('Please Wait Generating unit test...').start();

        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{
                    "role": "user",
                    "content": this.UNIT_TEST_REQUEST(framework, path, code)
                }],
                // temperature: 0,
                max_tokens: 1000,
            });

            await backupResponse(response.data);

            const { message } = response.data.choices[0];
            if (!message) throw new Error('No message found in response')

            logging.verbose('Response message:', message);

            let output = message.content;
            if (!output) throw new Error('No output found in response')

            logging.verbose('Response output:', output);

            output = this.cleanAllButCode(output);

            logging.verbose('Response output cleaned:', output);

            spinner.succeed('Unit test generated');
            return output;
        } catch (error) {
            spinner.fail(`Error generating unit test: ${error}`);
        }
    }

    cleanAllButCode(output: string) {
        // code starts with ``` and ends with ```
        const codeRegex = /```[\s\S]*```/g;
        let match = output.match(codeRegex)
        if (!match) {
            logging.warn('No code found in response. Probably the response is already a unit test. Returning as is.')
            return output;
        }
        let code = match[0];

        // Remove first and last lines
        code = code.split('\n').slice(1, -1).join('\n');

        logging.info('Was:', output);
        logging.info('Now:', code);

        return code;
    }
}

async function backupResponse(response: CreateChatCompletionResponse) {
    // Save response to json file
    const date = new Date().toISOString().replace(/:/g, '-');
    const fileName = `response-${date}.json`;
    const folderName = 'backup-responses';
    const filepath = `./${folderName}/${fileName}`;

    if (!fs.existsSync(folderName))
        fs.mkdirSync(folderName)

    try {
        fs.writeFileSync(filepath, JSON.stringify(response, null, 2));
    } catch (error) {
        logging.error(`Error during response backup to ${filepath}: ${error}`);
    }

    logging.info(`Response saved to ${filepath}`);
}



export default OpenAPI;
