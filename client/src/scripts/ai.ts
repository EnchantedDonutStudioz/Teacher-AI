import { marked } from 'marked';

const fileInput = document.getElementById('studentFile') as HTMLInputElement | null;
const submitButton = document.getElementById('submit') as HTMLButtonElement | null;
const selection = document.getElementById('purpose') as HTMLSelectElement | null;
const resultsContainer = document.getElementById('results-container') as HTMLDivElement | null;
const aiResponse = document.getElementById('ai-response') as HTMLDivElement | null;
const errorContainer = document.getElementById('error-container') as HTMLDivElement | null;
const errorMessage = document.getElementById('error-message') as HTMLParagraphElement | null;
const buttonText = document.getElementById('button-text') as HTMLSpanElement | null;
const loadingSpinner = document.getElementById('loading-spinner') as HTMLSpanElement | null;
const fileName = document.getElementById('file-name') as HTMLParagraphElement | null;
const newAnalysisBtn = document.getElementById('new-analysis') as HTMLButtonElement | null;

const apiKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY;
let csvContent: string | undefined = undefined;

let promptPurpose = 'Evaluate my students` responses and give me information on things like what they all (or mostly) struggled with, what they all (or mostly) did well, etc.';

selection?.addEventListener('change', () => {
    if (selection.value === '1') {
        promptPurpose = 'Evaluate my students` responses and give me information on things like what they all (or mostly) struggled with, what they all (or mostly) did well, etc.';
    } else if (selection.value === '2') {
        promptPurpose = 'Evaluate my students` responses and see if there are any grading mistakes. Do this by seeing if any student answers have typos (maybe if there was no typo, the question should be marked right), or maybe the student`s answer is also valid but is marked wrong.';
    }
});

fileInput?.addEventListener('change', async () => {
    const file = fileInput?.files?.[0];
    if (file) {
        csvContent = await file.text();
        if (fileName) {

            fileName.textContent = `📄 ${file.name}`;
            fileName.classList.remove('hidden');
        }
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});

submitButton?.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!csvContent) {
        showError('Please upload a CSV file first.');
        return;
    }

    setLoadingState(true);
    hideError();
    hideResults();

    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Teacher AI Assistant',
                'Content-Type': 'application-json',
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat-v3.1:free',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful teacher assistant AI. Your only role is to assist teachers in grading, evaluating, and providing feedback on student work. You provide clear, well-structured answers using Markdown formatting (e.g., ## for headings, - for bullet points, ** for bold). You NEVER refer to yourself with a personal pronoun like "I". Instead of "I found a grading inconsistency", say "A grading inconsistency was found".'
                    },
                    {
                        role: 'user',
                        content: `${promptPurpose}\n\nHere is the CSV data of their responses:\n\n${csvContent}`
                    }
                ],
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`API request failed: ${res.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await res.json();
        const responseContent = data.choices[0].message.content;

        displayResponse(responseContent);

    } catch (err) {
        console.error(err);
        showError('An error occurred while analyzing the data. Please try again.');
    } finally {
        setLoadingState(false);
    }
});

newAnalysisBtn?.addEventListener('click', () => {
    resetForm();
});

function setLoadingState(loading: boolean) {
    if (submitButton) {
        submitButton.disabled = loading;
    }
    if (buttonText && loadingSpinner) {
        buttonText.style.display = loading ? 'none' : 'flex';
        loadingSpinner.style.display = loading ? 'block' : 'none';
    }
}

function displayResponse(content: string) {
    if (aiResponse && resultsContainer) {

        aiResponse.innerHTML = marked.parse(content) as string;

        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showError(message: string) {
    if (errorMessage && errorContainer) {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    }
}

function hideError() {
    if (errorContainer) {
        errorContainer.classList.add('hidden');
    }
}

function hideResults() {
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }
}

function resetForm() {
    if (fileInput) fileInput.value = '';
    if (fileName) {
        fileName.textContent = '';
        fileName.classList.add('hidden');
    }
    if (submitButton) submitButton.disabled = true;
    csvContent = undefined;
    hideResults();
    hideError();
}