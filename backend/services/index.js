process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const axios = require('axios')
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

//---------------------------------------------------------------------//

async function stationAlreadyExistsLine(line, name) {
  const request = await Station.find({ line: line, name: name })
  if (request.length > 0) return true
  else return false
}

async function stationExists(id) {
  const request = await Station.findById(id)
  if (!!request) return true
  else return false
}

async function segmentAlreadyExistsLine(lineID, fromID, toID) {
  const request = await Line.find(
    {
      _id: lineID,
      'route.from.id': fromID,
      'route.to.id': toID,
    },
    {
      route: {
        $elemMatch: {
          'from.id': fromID,
          'to.id': toID,
        },
      },
    }
  )
  if (request.length > 0) return true
  else return false
}

//Add new station to db
app.post('/stations', (request, response) => {
  const body = request.body
  const station = new Station(body)
  // if (!stationAlreadyExistsLine(body.line, body.name))
  stationAlreadyExistsLine(body.line, body.name).then((data) => {
    if (!data)
      station
        .save()
        .then((data) => {
          response.json(data)
          console.log('Station added successfully')
        })
        .catch((err) => response.json(err))
    else
      response.status(409).json({
        status: 409,
        message: 'Station already exists in this line',
      })
  })
})

//Add new line to db
app.post('/lines', (request, response) => {
  const line = new Line(request.body)
  line
    .save()
    .then((data) => {
      response.json(data)
      console.log('Line added successfully')
    })
    .catch((err) => response.json(err))
})

//Get station by ID
app.get('/station', (request, response) => {
  let id = request.query.id
  Station.findById(id)
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get station by ID
app.get('/station/:name', (request, response) => {
  let name = request.params.name
  Station.find({ name: name })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get the stations of a line (no duplicates)
app.get('/stations/:line', (request, response) => {
  let line = request.params.line
  Station.find({ line: line })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get all the stations
app.get('/stations', (request, response) => {
  Station.find({})
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
      raw = data[0].route
      let fromStations = [],
        toStations = []
      raw.forEach((item) => {
        fromStations.push(item.from)
        toStations.push(item.to)
      })
      let result = {
        from: fromStations,
        to: toStations,
      }
      response.json(result)
    })
    .catch((err) => response.json(err))
})

app.get('/lines/all', (request, response) => {
  Line.find({}, { _id: 1, name: 1 })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get segment by ID
app.get('/segment', (request, response) => {
  let id = request.query.id
  Line.find({ 'route._id': id }, { route: { $elemMatch: { _id: id } } })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

//Get segment by FROM station ID
app.get('/segment/from', (request, response) => {
  let id = request.query.id
  Line.findOne(
    { 'route.from.id': id },
    { route: { $elemMatch: { 'from.id': id } }, _id: 0 }
  )
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
  let fromID = request.query.from
  let toID = request.query.to
  Line.find(
    {
      name: line,
      'route.from.id': fromID,
      'route.to.id': toID,
    },
    {
      route: {
        $elemMatch: {
          'from.id': fromID,
          'to.id': toID,
        },
      },
    }
  )
    .then((data) => {
      if (data.length > 0)
        response.json({
          from: data[0].route[0].from,
          to: data[0].route[0].to,
          path: data[0].route[0].path,
          id: data[0].route[0]._id,
          line: line,
        })
      else
        response.json({
          status: 404,
          message: 'Inexistant segment',
        })
    })
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
  let id = request.query.id
  let body = request.body
  Line.updateOne({ 'route._id': id }, { $set: { 'route.$': body } })
    .then((data) => response.json(data))
    .catch((err) => response.json(err))
})

app.patch('/line', (request, response) => {
  let id = request.query.id
  let body = request.body
  let fromID = body.from.id
  let toID = body.to.id

  segmentAlreadyExistsLine(id, fromID, toID).then((data) => {
    if (!data) {
      Line.updateOne({ _id: id }, { $push: { route: body } })
        .then((data) => response.json(data))
        .catch((err) => response.json(err))
    } else
      response.status(409).json({
        status: 409,
        message: 'Segment exists already',
      })
  })
})

// Delete a station by ID
app.delete('/stations/:id', (request, response) => {
  let id = request.params.id
  stationExists(id).then((data) => {
    if (data)
      Station.findByIdAndDelete(id)
        .then(() =>
          response.status(200).json({
            status: 200,
            message: 'Station deleted successfully',
          })
        )
        .catch((err) => response.json(err))
    else {
      response.status(404).json({
        status: 404,
        message: 'Station does not exists',
      })
    }
  })
})

app.delete('/lines/station/:id', (request, response) => {
  let id = request.params.id
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
  ]).then((data) => {
    if (data.length === 1) {
      Line.updateOne(
        { _id: data[0]._id },
        { $pull: { route: { _id: data[0].route._id } } }
      )
        .then(() =>
          response.status(200).json({
            status: 200,
            message: 'Deleted station from the line correctly',
          })
        )
        .catch((err) => response.json(err))
    } else if (data.length === 2) {
      let newPath = []
      let firstPath = [...data[0].route.path]
      let secondPath = [...data[1].route.path]
      secondPath.shift()
      newPath = [...firstPath, ...secondPath]

      let newSegment = {
        from: data[0].route.from,
        to: data[1].route.to,
        path: newPath,
      }
      Line.updateOne(
        { _id: data[1]._id },
        { $pull: { route: { _id: data[1].route._id } } }
      ).then(() => {
        Line.updateOne(
          { 'route._id': data[0].route._id },
          { $set: { 'route.$': newSegment } }
        )
          .then(() =>
            response.json({
              status: 200,
              message: 'Patched the line successfully',
            })
          )
          .catch((err) => response.json(err))
      })
    }
  })
})

/*
db.lines.aggregate(
  {$match: {$or:[
    {"route.from.id":"61eb2de817e57cb86cb3f8fa"},
    {"route.to.id":"61eb2de817e57cb86cb3f8fa"}]}},
  {$unwind: "$route"},
  {$match: {$or:[
    {"route.from.id":"61eb2de817e57cb86cb3f8fa"},
    {"route.to.id":"61eb2de817e57cb86cb3f8fa"}]}}
)

// stations = stations.filter((v, i, a) => a.findIndex((t) => t.order === v.order) === i)
"_id": "+[a-zA-Z0-9]+"
*/

// setTimeout(() => {
//   axios
//     .delete('http://localhost:4000/lines/station/61fc5a0b04d429af36a7973b')
//     .then((data) => console.log(data))
// }, 3000)
