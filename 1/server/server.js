const express = require('express')
var cors = require('cors')
const app = express()
const port = 3000
const axios = require('axios').default;

app.use(cors())
const APP_ID = "<APP_ID_OPEN_WEATHER>";

app.get('/api/:city', async(req, res, next) => {
    const city = req.param('city')
    try {
        resp = await axios.get(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&APPID=${APP_ID}`)
        res.json(resp.data)
    } catch (e) {
        console.log(e);
        next(e)
    }
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})