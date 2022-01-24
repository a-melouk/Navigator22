process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const Models = require('./Models/line')
const { ObjectId } = require('mongodb')

const Line = Models.Line
const Station = Models.Station

//express app
const app = express()
app.use(bodyParser.json())
app.use(cors())
const dbURI = 'mongodb://127.0.0.1/navigator-copy2'
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

app.get('/station', (request, response) => {
  let id = request.query.id
  console.log('Attempt to get station with ID: ' + id)
  Station.findById(id)
    .then((data) => {
      response.json(data)
      console.log('Station retreived successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve the station with ID: ' + id)
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

//Get segment by _id
app.get('/segment', (request, response) => {
  let id = request.query.id
  console.log('Attempt to get the segment with ID= ' + id)
  Line.find({ 'route._id': id }, { route: { $elemMatch: { _id: id } } })
    .then((data) => {
      response.json(data)
      console.log('Segment retreived successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve the segment')
    })
})

//Get segment by FROM station ID
app.get('/segment/from', (request, response) => {
  let id = request.query.id
  console.log('Attempt to get the segment with FROM station ID :' + id)
  // db.lines.find({ 'route.from.id': "61eb2de817e57cb86cb3f8fa" }, { route: { $elemMatch: { 'from.id': "61eb2de817e57cb86cb3f8fa" } }, _id: 0 })
  Line.findOne({ 'route.from.id': id }, { route: { $elemMatch: { 'from.id': id } }, _id: 0 })
    .then((data) => {
      response.json(data.route[0])
      console.log('Segment retreived successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve the segment with FROM station ID: ' + id)
    })
})

//Get segment by TO station ID
app.get('/segment/to', (request, response) => {
  let id = request.query.id
  console.log('Attempt to get the segment with TO station ID :' + id)
  // db.lines.find({ 'route.to.id': '61eb2de817e57cb86cb3f8fc' }, { route: { $elemMatch: { 'to.id': '61eb2de817e57cb86cb3f8fc' } }, _id: 0 })
  Line.findOne({ 'route.to.id': id }, { route: { $elemMatch: { 'to.id': id } }, _id: 0 })
    .then((data) => {
      response.json(data.route[0])
      console.log('Segment retreived successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve the segment with TO station ID: ' + id)
    })
})

//Get a segment that includes FROM & TO stations
app.get('/lines/:line', (request, response) => {
  let line = request.params.line
  let from = request.query.from
  let to = request.query.to
  console.log('Attempt to retrieve the segment :' + from + ' to ' + to)
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
    .then((data) => {
      console.log(data)
      response.json(data)
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to retrieve a segment')
    })
})

//Update station by id
//Does not update the _id field (GOOD)
app.patch('/station', (request, response) => {
  console.log('Attempt to patch a station')
  let id = request.query.id
  let body = request.body
  Station.findByIdAndUpdate(id, body)
    .then((data) => {
      response.json(data)
      console.log('Patched successfully')
    })
    .catch((err) => {
      response.json(err)
      console.log('Failed to patch a station')
    })
})

//Update segment by id
app.patch('/segment', (request, response) => {
  console.log('Attempt to patch a segment')
  let id = request.query.id
  let body = request.body
  // Line.findByIdAndUpdate(id, body)
  Line.updateOne({ 'route._id': id }, { $set: { 'route.$': body } })
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
