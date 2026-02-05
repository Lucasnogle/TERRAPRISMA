require('dotenv').config();
const express = require('express');
const cors = require('cors');
const router = require('./router');

const app = express();

app.use(express.json());
app.use(cors());

app.use(router);

if (process.env.NODE_ENV === 'production') {
    const http = require('http');
    const httpServer = http.createServer(app);
    httpServer.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
}

module.exports = app;
