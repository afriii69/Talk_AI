const log = require("./engine/c.js");
const puppeteer = require("puppeteer");
const fs = require('fs');
const fsPromises = fs.promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const stdin = process.stdin;

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

const link = (txt, url) => console.log(`\x1b[1m\x1b[34m\x1b[4m${txt}\x1b[0m ${url}`);



const logoutSelector = 'a[href="#"][class*="text-token-text-secondary"]';
const inputSelectors = [
    'p[data-placeholder="Ask anything"]',
    'textarea[data-testid="prompt-textarea"]',
    'div[data-testid="prompt-textarea"] p',
    '[contenteditable="true"]'
];

function flt(dat) {
    return dat
        .replace(/\p{Extended_Pictographic}|["]|^\s*[-•*]\s*|^\s*\d+[.)]\s*/gmu, "")
        .replace(/&/g, "dan")
        .replace(/“|”/g, '')
        .replace(/\n{2,}/g, "\n")
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "")
        .join(", ");
}

let isProcessing = false;

async function main() {
    fs.writeFileSync('chat.txt', '');
    log.b('[🔄] searching...');

    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: 'http://localhost:6969'
        });
        log.g('[✅] 6969');
    } catch (error) {
        log.r("[❌] 6969");
        return;
    }

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('chatgpt.com'));

    if (!page) {
        log.b('[📄] opening GPT...');
        page = await browser.newPage();
        await page.goto('https://chatgpt.com/');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
        log.b('[🔄] logging out...');
        await page.waitForSelector(logoutSelector, { timeout: 3000 });
        await page.click(logoutSelector);
        log.g('[✅] Clicked');
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
        log.y('[❌] Already handled');
    }

    const systemMessage = "Respond in simple, human-like conversation, keep it short and concise, and use indonesian language";

    try {
        log.b(`[🛠️ ] Set Up GPT...`);
        console.log(`[🕢] Sembari nunggu, mampir geh ke \x1b[1m\x1b[4m\x1b[34mhttps://github.com/afriii69\x1b[0m`)

        let inputFound = false;
        for (const selector of inputSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 300 });
                await page.click(selector);
                for (const char of systemMessage) {
                    await page.keyboard.press(char);
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                }
                inputFound = true;
                break;
            } catch (e) {
                continue;
            }
        }
        await page.keyboard.press('Enter');
        log.y(`[${inputFound ? '✅' : '❌'}] Set Up GPT`);

    } catch (error) {
        console.error('Error sending system message:', error.message);
    }

    log.y('[🔲] Press "SPACE" for speaking...');

    stdin.on('data', async (key) => {
        if (key === ' ' && !isProcessing) {
            isProcessing = true;

            try {
                log.b(`\n[🎙️ ] Ngomonglah...`);
                const { stdout: sttStdout, stderr: sttStderr } = await execPromise('python engine/stt.py');
                if (sttStderr) {
                    console.error(`STT stderr: ${sttStderr}`);
                    isProcessing = false;
                    return;
                }
                log.g(`[✅] STT Done`);

                await new Promise(resolve => setTimeout(resolve, 500));

                const message = await fsPromises.readFile("voice.txt", 'utf8');
                log.g(`[🎙️] You: ${message}`);

                if (message.toLowerCase() === 'exit') {
                    await browser.disconnect();
                    const cmd = process.platform === 'win32'
                        ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :6969') do taskkill /PID %a /F`
                        : `lsof -ti :6969 | xargs kill -9`;

                    exec(cmd);
                    isProcessing = false;
                    process.exit(0);
                    return;
                }

                let inputFound = false;
                for (const selector of inputSelectors) {
                    try {
                        await page.waitForSelector(selector, { timeout: 300 });
                        await page.click(selector);

                        for (const char of message) {
                            await page.keyboard.press(char);
                            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                        }

                        inputFound = true;
                        break;
                    } catch (e) {
                        continue;
                    }
                }

                if (!inputFound) {
                    log.r('Input field not found, pls check is gpt loaded correctly or not');
                    isProcessing = false;
                    return;
                }

                await page.keyboard.press('Enter');

                log.y('[🔄] WAITING...');

                let isLoading = true;
                let attempts = 0;
                const maxAttempts = 120;

                while (isLoading && attempts < maxAttempts) {
                    try {
                        const loadingElement = await page.$('[data-testid="loading"]');
                        isLoading = loadingElement !== null;
                        if (isLoading) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                            attempts++;
                        }
                    } catch (e) {
                        isLoading = false;
                    }
                }

                if (attempts >= maxAttempts) {
                    log.r('Response timeout, maybe ur network didnt fast enough?');
                }

                log.g('[✅] WRITING...');
                let previousText = '';
                let stableCount = 0;
                const maxStableChecks = 30;

                while (stableCount < 5 && attempts < maxStableChecks) {
                    try {
                        const responseElement = await page.$('article[data-turn="assistant"]:last-child .markdown.prose.w-full.wrap-break-word.markdown-new-styling');
                        if (responseElement) {
                            const currentText = await page.evaluate(el => el.textContent, responseElement);
                            if (currentText === previousText && currentText.trim()) {
                                stableCount++;
                            } else {
                                stableCount = 0;
                                previousText = currentText;
                            }
                        }
                        await new Promise(resolve => setTimeout(resolve, 200));
                        attempts++;
                    } catch (e) {
                        break;
                    }
                }

                let response = '[❌] 404 Response';
                const responseSelectors = [
                    'article[data-turn="assistant"]:last-child .markdown.prose.w-full.wrap-break-word.markdown-new-styling',
                    'div[data-message-author-role="assistant"]:last-child .markdown.prose.w-full.wrap-break-word.markdown-new-styling',
                    'div[data-message-author-role="assistant"]:last-child .markdown',
                    'div[data-message-id]:last-child .markdown p',
                    'p[data-start]:last-child',
                    '.markdown p:last-child'
                ];

                for (const selector of responseSelectors) {
                    try {
                        const element = await page.$(selector);
                        if (element) {
                            response = await page.evaluate(el => el.textContent, element);
                            if (response && response.trim()) {
                                break;
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }

                const resp = flt(response);
                fs.writeFileSync('chat.txt', resp);

                log.g(`AI: ${response}\n`);
                

            } catch (error) {
                console.error('Error Interaction:', error.message);
                isProcessing = false;
                return;
            }

            try {
                const { stdout: ttsStdout, stderr: ttsStderr } = await execPromise('python engine/tts.py');
                if (ttsStderr) {
                    console.error(`TTS stderr: ${ttsStderr}`);
                }
                log.g(`[🔊] TTS Done`);
            } catch (error) {
                console.error(`Error executing TTS: ${error.message}`);
            } finally {
                isProcessing = false;
            }

            log.y('[🔲] Press "SPACE" for speaking...');
        }

        if (key === '\u0003') {
            process.exit();
        }
    });
}

main().catch(console.error);