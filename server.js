require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3500;

// Cross Origin Resource Sharing
app.use(cors())
// built in middleware to handle urlencoded data
app.use(express.urlencoded({ extended: false}))
// built in middleware for json
app.use(express.json())
// serve static files
app.use('/', express.static(path.join(__dirname, '/views')))
app.use('/states', require('./routes/api/states'))

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ error: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

mongoose.connect(process.env.DATABASE_URI)
mongoose.connection.once('open', () => {
    console.log('Connected to MongoDO');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
