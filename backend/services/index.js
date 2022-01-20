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
  app.listen(4000)
  console.log('Running on 4000')
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

//Get a line by name
app.get('/lines', (request, response) => {
  let name = request.query.name
  Line.find({ name: name })
    .then((data) => response.json(data))
    .catch((err) => {
      console.log(err)
      response.json(err)
    })
})

//Get a part between two stations (Two stations a segment between them)
app.get('/lines/segment', (request, response) => {
  let from = request.query.from
  let to = request.query.to
  Line.find({ 'route.from.name': from, 'route.to.name': to }, { route: { $elemMatch: { 'from.name': from, 'to.name': to } } })
    .then((data) => {
      let donnee = data[0].route[0]
      response.json({
        from: donnee.from,
        to: donnee.to,
        path: donnee.path,
        id: donnee._id,
      })
    })
    .catch((err) => {
      console.log(err)
      response.json(err)
    })
})

// db.lines.find({ 'route.from.name': 'Wiam', 'route.to.name': 'Daira' }, { route: { $elemMatch: { 'from.name': 'Wiam', 'to.name': 'Daira'} } }).pretty()

//Get all the stations
app.get('/stations', (request, response) => {
  let stations = []
  Line.find({})
    .then((data) => {
      let donnee = data[0].route
      donnee.forEach((item) => {
        stations.push(item.from, item.to)
      })
      stations = stations.filter((v, i, a) => a.findIndex((t) => t.order === v.order) === i)
      response.json(stations)
    })
    .catch((err) => {
      console.log(err)
      response.json(err)
    })
})

app.patch('/lines/:from', (request, response) => {
  let from = request.params.from
  let body = request.body
  Line.updateOne({ 'route.from.name': from }, { $set: { 'route.$': body } })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})
/* 
app.patch('lines/:id', (request, response) => {
  let id = request.params.id
  let body = request.body
  console.log(body)
  Line.findByIdAndUpdate(
    { 'route._id': ObjectId(id) },
    { route: { $elemMatch: { _id: ObjectId(id) } } },
    {
      $set: { path: body },
    }
  )
          .then((data) => response.json(data))
    .catch((err) => response.json(err))
}) */

/*

db.lines.find({ "route._id": ObjectId("61e89506430fd641ba131aa3") },{ route: { $elemMatch: { '_id': ObjectId("61e89506430fd641ba131aa3") } } }).pretty()
db.lines.find({ "route.from.name": "Wiam" }).pretty()

*/
