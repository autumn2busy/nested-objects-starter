const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];

if (!filePath) {
    console.error("Please provide a file path");
    process.exit(1);
}

const absolutePath = path.resolve(filePath);

console.log(`Processing: ${absolutePath}`);

const outputFilePath = process.argv[3];

mammoth.convertToHtml({ path: absolutePath })
    .then(function (result) {
        const html = result.value; // The generated HTML
        const messages = result.messages; // Any messages, such as warnings during conversion

        if (outputFilePath) {
            fs.writeFileSync(outputFilePath, html, 'utf8');
            console.log(`Written to ${outputFilePath}`);
        } else {
            console.log("--- HTML START ---");
            console.log(html);
            console.log("--- HTML END ---");
        }

        if (messages.length > 0) {
            console.log("Messages:", messages);
        }
    })
    .catch(function (error) {
        console.error(error);
    });
