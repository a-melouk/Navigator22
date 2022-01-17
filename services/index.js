process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const Models = require('./Models/line')

const Line = Models.Line
const Polyline = Models.Polyline

//express app
const app = express()
app.use(bodyParser.json())
app.use(
  cors({
    origin: 'http://127.0.0.1:5500',
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

app.post('/polyline', (request, response) => {
  const polyline = new Polyline(request.body)
  polyline
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

app.get('/polyline/:numero', (request, response) => {
  let params = request.params.numero
  Polyline.find({ name: params })
    .then((data) => response.json(data))
    .catch((err) => {
      console.log(err)
      response.json(err)
    })
})
