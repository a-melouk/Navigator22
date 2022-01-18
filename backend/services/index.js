process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const Models = require('./Models/line')

const Line = Models.Line
const Polyline = Models.Polyline
const Station = Models.Station

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

app.post('/station', (request, response) => {
  const station = new Station(request.body)
  station
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

app.get('/polyline/:name', (request, response) => {
  let params = request.params.name
  Polyline.find({ name: params })
    .then((data) => response.json(data))
    .catch((err) => {
      console.log(err)
      response.json(err)
    })
})

app.get('/lines/:name', (request, response) => {
  let params = request.params.name
  Line.find({ name: params })
    .then((data) => response.json(data))
    .catch((err) => {
      console.log(err)
      response.json(err)
    })
})
