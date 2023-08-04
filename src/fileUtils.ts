import fs from 'fs';
import path from 'path';
import logging from 'improved-logging'

export async function createTestSuitFileWith(filepath: string, output: string) {
    const testsDirName = '__tests__'
    if (!fs.existsSync(testsDirName))
        fs.mkdirSync(testsDirName);

    const fileName = path.parse(filepath).name;
    const resultFilePath = path.join(testsDirName, `${fileName}.test.js`);
    try {
        await fs.promises.writeFile(resultFilePath, output);
        logging.info(`Output written to file: ${resultFilePath}`);
    } catch (error) {
        logging.error(`Error writing to file: ${error}`);
    }
}

export function getFilesRecursivelyFrom(dir: string): string[] {
    const filepaths: string[] = [];

    function traverseDir(currentDir: string) {
        const files = fs.readdirSync(currentDir);

        files.forEach((file) => {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                traverseDir(filePath);
            } else if (stat.isFile()) {
                filepaths.push(filePath);
            }
        });
    }

    traverseDir(dir);

    return filepaths
}