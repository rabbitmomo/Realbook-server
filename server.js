const express = require('express');
const cors = require('cors');
const ort = require('onnxruntime-node');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');  
const app = express();

app.use(cors());

app.use(express.json());

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,  
});

// Add data to Supabase
async function addDataToSupabase(url, isPhishing, probability) {
    try {
        console.log('Adding data to Supabase:', { url, isPhishing, probability });
        
        const { data, error } = await supabase
            .from('phishing_data')
            .insert([{ url, is_phishing: isPhishing, probability }]);

        if (error) {
            throw error;
        }

        console.log('Data added to Supabase successfully:', data);
    } catch (error) {
        console.error('Error adding data to Supabase:', error);
        throw new Error(`Error adding data to Supabase: ${error.message}`);
    }
}

// Handle POST requests to /gpt-response
app.post('/gpt-response', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
        });

        return res.json({
            reply: response.choices[0].message.content,
        });
    } catch (e) {
        console.error("Error calling GPT model:", e);
        return res.status(500).json({ error: 'Failed to get response from GPT model', message: e.message });
    }
});

// Handle POST requests to /send-crypto (fake transaction)
app.post('/send-crypto', (req, res) => {
    const { sender, recipient, amount } = req.body;

    if (!sender || !recipient || !amount) {
        return res.status(400).json({ error: 'Sender, recipient, and amount are required' });
    }

    try {
        const transactionHash = `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

        return res.json({
            message: 'Transaction successful!',
            transactionHash: transactionHash,
        });
    } catch (e) {
        console.error("Error processing crypto transaction:", e);
        return res.status(500).json({
            error: 'Failed to process transaction',
            message: e.message,
        });
    }
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
