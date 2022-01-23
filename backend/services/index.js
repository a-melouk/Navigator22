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
app.use(cors())
const dbURI = 'mongodb://127.0.0.1/navigator'
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  app.listen(4000)
  console.log('Running on 4000')
})

app.post('/stations', (request, response) => {
  const station = new Station(request.body)
  console.log('Attempt to add a new station', station)
  station
    .save()
    .then((data) => {
      response.json(data)
      console.log('Station added successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed adding the station')
    })
})

app.post('/lines', (request, response) => {
  const line = new Line(request.body)
  console.log('Attempt to add a new line', line)
  line
    .save()
    .then((data) => {
      response.json(data)
      console.log('Line added successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed adding the line')
    })
})

//Get all the stations
app.get('/stations', (request, response) => {
  console.log('Attempt to get all the stations')
  Station.find({})
    .then((data) => {
      response.json(data)
      console.log('All stations retreived successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve all the stations')
    })
})

//Get the stations of a line
app.get('/stations/:line', (request, response) => {
  let line = request.params.line
  console.log('Attempt to get stations of ' + line)
  Station.find({ line: line })
    .then((data) => {
      response.json(data)
      console.log('All stations retreived successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve all the stations')
    })
})

//Get a line by name
app.get('/lines', (request, response) => {
  let name = request.query.name
  console.log('Attempt to get a the line: ' + name)
  Line.find({ name: name })
    .then((data) => {
      response.json(data)
      console.log('Line retreived successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve the line')
    })
})

//Get a part between two stations (Two stations a segment between them)
app.get('/lines/:line', (request, response) => {
  let line = request.params.line
  let from = request.query.from
  let to = request.query.to
  console.log('Attempt to retrieve the segment :' + from + ' to ' + to)
  // Line.find({ name: line, 'route.from.name': from, 'route.to.name': to }, { route: { $elemMatch: { 'from.name': from, 'to.name': to } } })
  Line.find({ name: line, 'route.from.name': from, 'route.to.name': to })
    .then((data) => {
      let donnee = data[0].route[0]
      response.json({
        from: donnee.from,
        to: donnee.to,
        path: donnee.path,
        id: donnee._id,
      })
      console.log('Segment retreived successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve a segment')
    })
})

app.get('/test', (request, response) => {
  Line.aggregate([
    { $match: { $or: [{ 'route.from.id': '61eb2de817e57cb86cb3f8fa' }, { 'route.to.id': '61eb2de817e57cb86cb3f8fa' }] } },
    { $unwind: '$route' },
    { $match: { $or: [{ 'route.from.id': '61eb2de817e57cb86cb3f8fa' }, { 'route.to.id': '61eb2de817e57cb86cb3f8fa' }] } },
  ])
    .then((data) => {
      console.log(data)
      response.json(data)
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve a segment')
    })
})

app.patch('/lines/:from', (request, response) => {
  console.log('Attempt to patch a segment')
  let from = request.params.from
  let body = request.body
  Line.updateOne({ 'route.from.name': from }, { $set: { 'route.$': body } })
    .then((data) => {
      response.json(data)
      console.log('Patched successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to patch a segment')
    })
})

// 61eb3a340ea98782be559c2d

/*

db.lines.find({$or:[{"route.from.id":"61eb2de817e57cb86cb3f8fa"},{"route.to.id":"61eb2de817e57cb86cb3f8fa"}]},
    {route:
        {$elemMatch:
            {$or:[
                    {"from.id":"61eb2de817e57cb86cb3f8fa"},
                    
                 ]
            }
        }
    }
)

db.lines.aggregate(
  {$match: {$or:[{"route.from.id":"61eb2de817e57cb86cb3f8fa"},{"route.to.id":"61eb2de817e57cb86cb3f8fa"}]}},
  {$unwind: "$route"},
  {$match: {$or:[{"route.from.id":"61eb2de817e57cb86cb3f8fa"},{"route.to.id":"61eb2de817e57cb86cb3f8fa"}]}}
)

// stations = stations.filter((v, i, a) => a.findIndex((t) => t.order === v.order) === i)
"_id": "+[a-zA-Z0-9]+"
*/
