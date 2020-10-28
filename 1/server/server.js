const express = require('express')
var cors = require('cors')
const app = express()
const port = 3000
const axios = require('axios').default;

app.use(cors())
const APP_ID = "190a2ef716e0d6ae3f5ab5d747ece459";
const daysCount = "5";

app.get('/api/:city', async(req, res, next) => {
    const city = req.param('city')
    try {
        resp = await axios.get(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&APPID=${APP_ID}`)
    } catch (e) {
        console.log(e);
        next(e)
        return;
    }
    res.json(resp.data)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})