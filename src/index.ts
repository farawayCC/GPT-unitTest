import OpenAPI from "./OpenAI.js";
import fs from 'fs';
import path from 'path';
import { createTestSuitFileWith, getFilesRecursivelyFrom } from "./fileUtils.js";
import logging from 'improved-logging'

logging.setLogLevel('info')

const pathFromArgs = process.argv[2]
if (!pathFromArgs) {
    logging.error('Please provide a path to a directory as a command line argument')
    process.exit(1)
}


const framework = 'Jest';


; (async () => {
    // Check if path exists
    if (!fs.existsSync(pathFromArgs)) {
        logging.error(`Path ${pathFromArgs} does not exist`);
        process.exit(1);
    }

    // Check if path is a directory
    const isDir = fs.lstatSync(pathFromArgs).isDirectory();
    if (isDir) {
        await workWithDir(pathFromArgs);
    } else {
        await processFile(pathFromArgs);
    }

    logging.success('Finished processing all files');
})();



async function workWithDir(pathToDir: string) {
    const filepaths = getFilesRecursivelyFrom(pathToDir);

    logging.info(filepaths);
    logging.info(`Found ${filepaths.length} files in ${pathToDir}`);

    for (let filepath of filepaths)
        await processFile(filepath);

}


async function processFile(pathtofile: string) {
    try {
        // Prepare output
        const open = new OpenAPI();
        const code = await open.readFileAsCode(pathtofile);
        const output = await open.generateUnitTest(code, framework, pathtofile);

        // Write output to file
        if (!output) throw new Error('No output found in response')
        await createTestSuitFileWith(pathtofile, output);
    } catch (error) {
        logging.error(error);
    }
}



