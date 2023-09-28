require('openai/shims/node');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai');
const bcrypt = require('bcrypt'); // I've retained this although it's unused in the provided code. You might need it for enhanced security later.
const morgan = require('morgan');

const app = express();
require('dotenv').config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const port = process.env.PORT || 3000;
const db = new sqlite3.Database('./users.db');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
    const corsOptions = {
        origin: 'https://dr-assist-frontend-ue2e.vercel.app/', // updated with your frontend's URL
        optionsSuccessStatus: 200
      };
      app.use(cors(corsOptions));

    // Adding morgan for logging
    app.use(morgan('combined'));

    // Chat functionality using OpenAI SDK
    app.post('/api/chat', async (req, res) => {
        const { prompt } = req.body;
        console.log('Received prompt from Angular:', prompt);

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });
            console.log('Full response from OpenAI:', JSON.stringify(response, null, 2));

            if (response.choices && response.choices[0] && response.choices[0].message) {
                // Extracted symptom information
                const symptomInfo = {
                    content: response.choices[0].message.content
                };

                // Set content type header explicitly
                res.setHeader('Content-Type', 'application/json');
                
                // Send the response as JSON with symptom information
                res.json(symptomInfo);
            } else {
                // Set content type header explicitly
                res.setHeader('Content-Type', 'application/json');
                
                res.status(500).json({ error: 'Unexpected response format' });
            }

        } catch (error) {
            // Set content type header explicitly
            res.setHeader('Content-Type', 'application/json');
            
            res.status(500).json({ error: error.message });
        }
    });



    // Authentication functionality using SQLite
    app.post('/api/login', (req, res) => {
        const { username, password } = req.body;

        db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server Error');
            }

            if (row) {
                res.status(200).json({ message: 'Authentication successful' });
            } else {
                res.status(401).json({ message: 'Authentication failed' });
            }
        });
    });

    app.post('/api/search-patient', (req, res) => {
        const { ID, Name, DateOfBirth } = req.body;

        const query = `
            SELECT * FROM PatientInformation
            WHERE
                (ID = ? OR ? = '') AND
                (Name LIKE '%' || ? || '%' OR ? = '') AND
                (DateOfBirth = ? OR ? = '')
        `;

        db.all(query, [ID, ID, Name, Name, DateOfBirth, DateOfBirth], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server Error');
            }
            res.status(200).json({ results: rows });
        });
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
