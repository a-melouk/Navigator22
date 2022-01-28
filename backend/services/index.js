process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const Models = require('./Models/line')

const Line = Models.Line
const Station = Models.Station

//express app
const app = express()
app.use(bodyParser.json())
app.use(cors())
const dbURI = 'mongodb://127.0.0.1/navigator'
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(4000)
    console.log('Running on 4000')
  })

app.post('/stations', (request, response) => {
  const station = new Station(request.body)
  station
    .save()
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

app.post('/lines', (request, response) => {
  const line = new Line(request.body)
  line
    .save()
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get all the stations
app.get('/stations', (request, response) => {
  Station.find({})
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get the stations of a line
app.get('/stations/:line', (request, response) => {
  let line = request.params.line
  Station.find({ line: line })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

app.get('/station', (request, response) => {
  let id = request.query.id
  Station.findById(id)
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get a line by name
app.get('/lines', (request, response) => {
  let name = request.query.name
  Line.find({ name: name })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get stations of a line
app.get('/lines/:line/stations', (request, response) => {
  let line = request.params.line
  Line.find({ name: line }, { route: 1, _id: 0 })
    .then((data) => {
      let result = []
      data = data[0].route
      let segment
      data.forEach((item) => {
        segment = {
          from: item.from,
          to: item.to,
        }
        result.push(segment)
      })
      response.json(result)
    })
    .catch((err) => response.json(err))
})

//Get segment by _id
app.get('/segment', (request, response) => {
  let id = request.query.id
  Line.find({ 'route._id': id }, { route: { $elemMatch: { _id: id } } })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get segment by FROM station ID
app.get('/segment/from', (request, response) => {
  let id = request.query.id
  Line.findOne({ 'route.from.id': id }, { route: { $elemMatch: { 'from.id': id } }, _id: 0 })
    .then((data) => response.json(data.route[0]))
    .catch((err) => response.json(err))
})

//Get segment by TO station ID
app.get('/segment/to', (request, response) => {
  let id = request.query.id
  Line.findOne({ 'route.to.id': id }, { route: { $elemMatch: { 'to.id': id } }, _id: 0 })
    .then((data) => response.json(data.route[0]))
    .catch((err) => response.json(err))
})

//Get a segment that includes FROM & TO stations
app.get('/lines/:line', (request, response) => {
  let line = request.params.line
  let from = request.query.from
  let to = request.query.to
  Line.find(
    {
      name: line,
      'route.from.name': from,
      'route.to.name': to,
    },
    {
      route: {
        $elemMatch: {
          'from.name': from,
          'to.name': to,
        },
      },
    }
  )
    .then((data) =>
      response.json({
        from: data[0].route[0].from,
        to: data[0].route[0].to,
        path: data[0].route[0].path,
        id: data[0].route[0]._id,
        line: line,
      })
    )
    .catch((err) => response.json(err))
})

//All segments that have (FROM || TO) as from || to
app.get('/segments', (request, response) => {
  let id = request.query.id
  Line.aggregate([
    {
      $match: {
        $or: [{ 'route.from.id': id }, { 'route.to.id': id }],
      },
    },
    { $unwind: '$route' },
    {
      $match: {
        $or: [{ 'route.from.id': id }, { 'route.to.id': id }],
      },
    },
  ])
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Update station by id
app.patch('/station', (request, response) => {
  let id = request.query.id
  let body = request.body
  Station.findByIdAndUpdate(id, body)
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Update segment by id
app.patch('/segment', (request, response) => {
  console.log('Attempt to patch a segment')
  let id = request.query.id
  let body = request.body
  Line.updateOne({ 'route._id': id }, { $set: { 'route.$': body } })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

app.patch('/patchline/:id', (request, response) => {
  let id = request.params.id
  let body = request.body
  Line.findByIdAndUpdate(id, body)
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
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
