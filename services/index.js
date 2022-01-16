process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const Line = require('./Models/line')

//express app
const app = express()
app.use(bodyParser.json())
app.use(
  cors({
    origin: 'http://localhost:8080',
  })
)
const dbURI = 'mongodb://127.0.0.1/navigator'
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('Running on 4000')
  app.listen(4000)
})

app.post('/lines', (request, response) => {
  const line = new Line(request.body)
  line
    .save()
    .then((data) => {
      response.json({
        status: 'success',
        donnee: data,
      })
    })
    .catch((err) => {
      response.json({
        reponse: err,
      })
      console.log(err)
    })
})
