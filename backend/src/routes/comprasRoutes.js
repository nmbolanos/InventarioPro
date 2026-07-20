const express = require('express');
const router = express.Router();
const axios = require('axios');

const COMPRAS_API = 'http://compras-alb-1632153594.us-east-1.elb.amazonaws.com/api';

router.use(async (req, res) => {
    try {
        const url = `${COMPRAS_API}${req.url}`;
        
        const headers = { ...req.headers };
        delete headers.host;
        delete headers['content-length'];
        
        const response = await axios({
            method: req.method,
            url: url,
            data: req.method !== 'GET' ? req.body : undefined,
            headers: headers
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error('Error proxying to compras API:', error.message);
            res.status(500).json({ error: 'Error de conexión con el API de Compras' });
        }
    }
});

module.exports = router;