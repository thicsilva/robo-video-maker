const algorithmia = require('algorithmia');
const algorithmiaKey = require('../credentials/algorithmia.json').apiKey;
const sentenceBoundaryDetection = require('sbd');

async function robot(content) {
    await fetchContentFromWikipedia(content);
    sanitizeContent(content);
    breakContentIntoSentences(content);

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaKey);
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300');
        const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm);
        const wikipediaContent = wikipediaResponde.get();

        content.sourceContentOriginal = wikipediaContent.content;
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdowns(content.sourceContentOriginal);
        const withoutDatesInParentheses = removeDateInParentheses(withoutBlankLinesAndMarkdown);

        content.sourceContentSanitized = withoutDatesInParentheses;

        function removeBlankLinesAndMarkdowns(text) {
            const allLines = text.split('\n');

            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().lenght === 0 || line.trim().startsWith('=')) {
                    return false;
                }
                return true;
            });

            return withoutBlankLinesAndMarkdown.join(' ');
        }
        function removeDateInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ');
        }
    }

    function breakContentIntoSentences(content) {
        content.sentences = [];

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized);
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            });
        });
    }
}

module.exports = robot;
