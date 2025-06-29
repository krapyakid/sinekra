// Mengimpor library Groq
const Groq = require('groq-sdk');

// Inisialisasi Groq dengan kunci API yang diambil dari environment variables Netlify
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Handler utama untuk serverless function
exports.handler = async (event) => {
    // Memastikan hanya metode POST yang diterima
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        // Mengambil prompt dari body permintaan yang dikirim oleh form.js
        const { prompt } = JSON.parse(event.body);

        // Jika tidak ada prompt, kembalikan error
        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Prompt is required' }),
            };
        }

        // Memanggil API Groq dengan prompt yang diterima
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 150,
        });

        // Mengirim kembali hasil dari AI ke form.js
        return {
            statusCode: 200,
            body: JSON.stringify({
                completion: chatCompletion.choices[0]?.message?.content || '',
            }),
        };
    } catch (error) {
        // Menangani jika terjadi error
        console.error('Error in Groq function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to communicate with AI service.', details: error.message }),
        };
    }
}; 
