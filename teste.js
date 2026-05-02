const express = require('express');
const app = express();
const PORT = 3005;

app.get('/', (req, res) => {
    console.log('--- REQUISIÇÃO RECEBIDA NO TESTE ---');
    res.send('<h1>O SERVIDOR ESTÁ VIVO!</h1>');
});

app.listen(PORT, () => {
    console.log(`TESTE SUPREMO EM: http://localhost:${PORT}`);
});
