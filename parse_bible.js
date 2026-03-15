const fs = require('fs');
const path = require('path');

const assetDir = path.join(__dirname, 'Asset');
const outputFilePath = path.join(__dirname, 'bible.json');

const parseFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const bookData = [];
    
    let currentChapter = -1;
    let currentChapterObj = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith('---')) continue; // Skip title lines
        
        // Example line: 마태복음 1장 1:1절: 아브라함과 다윗의 자손 예수 그리스도의 세계라
        // Let's use a regex to match the pattern:
        // (.+?) (\d+)장 \d+:(\d+)절:\s*(.*)
        const regex = /(.+?)\s+(\d+)장\s+\d+:(\d+)절:\s*(.*)/;
        const match = line.match(regex);
        
        if (match) {
            const bookName = match[1].trim();
            const chapterNum = parseInt(match[2], 10);
            const verseNum = parseInt(match[3], 10);
            const text = match[4].trim();

            if (currentChapter !== chapterNum) {
                if (currentChapterObj) {
                    bookData.push(currentChapterObj);
                }
                currentChapter = chapterNum;
                currentChapterObj = { chapter: chapterNum, verses: {} };
            }

            if (currentChapterObj) {
                currentChapterObj.verses[verseNum] = text;
            }
        }
    }

    if (currentChapterObj) {
        bookData.push(currentChapterObj);
    }

    return bookData;
};

const processDirectory = (dirPath) => {
    const result = {};
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        if (file.endsWith('.txt')) {
            const bookName = file.replace('.txt', '');
            console.log(`Parsing ${bookName}...`);
            const filePath = path.join(dirPath, file);
            result[bookName] = parseFile(filePath);
        }
    }
    return result;
};

const main = () => {
    const bibleData = {
        old_testament: processDirectory(path.join(assetDir, 'old_testament')),
        new_testament: processDirectory(path.join(assetDir, 'new_testament'))
    };

    fs.writeFileSync(outputFilePath, JSON.stringify(bibleData, null, 2), 'utf-8');
    console.log('Successfully generated bible.json');
};

main();
