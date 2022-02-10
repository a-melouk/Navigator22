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
const dbURI = 'mongodb://127.0.0.1/navigator'
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    app.listen(4000)
    console.log('Running on 4000')
  })
//---------------------------------------------------------------------//

// distance between two geographical points using spherical law of cosines approximation

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

async function segmentExists(lineID, fromID, toID) {
  const request = await Line.find(
    {
      _id: lineID,
      'route.from.id': fromID,
      'route.to.id': toID
    },
    {
      route: {
        $elemMatch: {
          'from.id': fromID,
          'to.id': toID
        }
      },
      _id: 0
    }
  )
  if (request[0]?.route[0]?._id)
    return {
      segmentID: request[0].route[0]._id,
      order: request[0]?.route[0]?.order
    }
  return undefined
}

async function segmentIdExists(lineID, segmentID) {
  const request = await Line.find(
    {
      _id: lineID,
      'route._id': segmentID
    },
    {
      route: {
        $elemMatch: {
          _id: segmentID
        }
      }
    }
  )
  if (request.length > 0) return true
  else return false
}

async function findLengthOfLine(lineID) {
  const response = await Line.find({ _id: lineID })
  const data = response[0].route.length
  return data
}

async function findOrderOfSegment(segmentID) {
  const response = await Line.find(
    { 'route._id': segmentID },
    { route: { $elemMatch: { _id: segmentID } } }
  )
  const data = response[0].route[0].order
  return data
}

function distance(latitude1, longitude1, latitude2, longitude2) {
  const R = 6371000
  let rad = Math.PI / 180,
    lat1 = latitude1 * rad,
    lat2 = latitude2 * rad,
    sinDLat = Math.sin(((latitude2 - latitude1) * rad) / 2),
    sinDLon = Math.sin(((longitude2 - longitude1) * rad) / 2),
    a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function removeClosePointsBack(path) {
  let initLength = path.length
  for (let i = 0; i < path.length - 2; i++)
    if (
      distance(path[i].latitude, path[i].longitude, path[i + 1].latitude, path[i + 1].longitude) <
      4.5
    )
      path.splice(i + 1, 1)

  if (
    distance(
      path[path.length - 2].latitude,
      path[path.length - 2].longitude,
      path[path.length - 1].latitude,
      path[path.length - 1].longitude
    ) < 4.5
  )
    path.splice(path.length - 2, 1)

  if (initLength > path.length) console.log('Removed close points')
  return path
}

//Add new station to db
app.post('/stations', (request, response) => {
  const body = request.body
  const station = new Station(body)
  stationAlreadyExistsLine(body.line, body.name).then(data => {
    if (!data)
      station
        .save()
        .then(data => {
          response.json(data)
          console.log('Station added successfully')
        })
        .catch(err => response.json(err))
    else
      response.status(409).json({
        status: 409,
        message: 'Station already exists in this line'
      })
  })
})

//Add new line to db
app.post('/lines', (request, response) => {
  let body = request.body
  let order = 1
  body.route.forEach(segment => {
    segment.order = order
    segment.path = removeClosePointsBack(segment.path)
    order++
  })
  const line = new Line(body)
  line
    .save()
    .then(data => {
      response.json(data)
      console.log('Line added successfully')
    })
    .catch(err => response.json(err))
})

//Get station by ID
app.get('/station', (request, response) => {
  let id = request.query.id
  Station.findById(id)
    .then(data => response.json(data))
    .catch(err => response.json(err))
})

//Get station by ID
app.get('/station/:name', (request, response) => {
  let name = request.params.name
  Station.find({ name: name })
    .then(data => response.json(data))
    .catch(err => response.json(err))
})

//Get the stations of a line (no duplicates)
app.get('/stations/:line', (request, response) => {
  let line = request.params.line
  Station.find({ line: line })
    .then(data => response.json(data))
    .catch(err => response.json(err))
})

//Get all the stations
app.get('/stations', (request, response) => {
  Station.find({})
    .then(data => response.json(data))
    .catch(err => response.json(err))
})

//Get a line by name
app.get('/lines', (request, response) => {
  let name = request.query.name
  Line.aggregate([
    { $match: { name: name } },
    { $unwind: '$route' },
    { $sort: { 'route.order': 1 } },
    { $group: { _id: '$_id', route: { $push: '$route' } } }
  ])
    .then(data => {
      let stations = []
      let route = []
      data[0].route.forEach(item => {
        stations.push(item.from)
        stations.push(item.to)
        route.push(item.path)
      })
      stations = stations.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

      response.json({
        stations: stations,
        route: route
      })
      // response.json(data)
    })
    .catch(err => response.json(err))
})

//Get stations of a line
app.get('/lines/:line/stations', (request, response) => {
  let line = request.params.line
  Line.find({ name: line }, { route: 1, _id: 0 })
    .then(data => {
      raw = data[0].route
      let fromStations = [],
        toStations = []
      raw.forEach(item => {
        fromStations.push(item.from)
        toStations.push(item.to)
      })
      let result = {
        from: fromStations,
        to: toStations
      }
      response.json(result)
    })
    .catch(err => response.json(err))
})

app.get('/lines/all', (request, response) => {
  Line.find({}, { _id: 1, name: 1 })
    .then(data => response.json(data))
    .catch(err => response.json(err))
})

//Get segment by ID
app.get('/segment', (request, response) => {
  let id = request.query.id
  Line.find({ 'route._id': id }, { route: { $elemMatch: { _id: id } } })
    .then(data => response.json(data))
    .catch(err => response.json(err))
})

//Get segment by FROM station ID
app.get('/segment/from', (request, response) => {
  let id = request.query.id
  Line.findOne({ 'route.from.id': id }, { route: { $elemMatch: { 'from.id': id } }, _id: 0 })
    .then(data => response.json(data.route[0]))
    .catch(err => response.json(err))
})

//Get segment by TO station ID
app.get('/segment/to', (request, response) => {
  let id = request.query.id
  Line.findOne({ 'route.to.id': id }, { route: { $elemMatch: { 'to.id': id } }, _id: 0 })
    .then(data => response.json(data.route[0]))
    .catch(err => response.json(err))
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
      'route.to.id': toID
    },
    {
      route: {
        $elemMatch: {
          'from.id': fromID,
          'to.id': toID
        }
      }
    }
  )
    .then(data => {
      if (data.length > 0)
        response.json({
          from: data[0].route[0].from,
          to: data[0].route[0].to,
          path: data[0].route[0].path,
          order: data[0].route[0].order,
          id: data[0].route[0]._id,
          line: line
        })
      else
        response.json({
          status: 404,
          message: 'Inexistant segment'
        })
    })
    .catch(err => response.json(err))
})

//Update station by id
app.patch('/station', (request, response) => {
  let id = request.query.id
  let body = request.body

  Station.findByIdAndUpdate(id, body)
    .then(data => {
      if (!!data)
        response.json({
          status: 200,
          message: 'Station updated successfully'
        })
      else
        response.status(404).json({
          status: 404,
          message: 'Station not found'
        })
    })
    .catch(err => response.json(err))
})

//Update segment's path by id
app.patch('/segment', (request, response) => {
  let id = request.query.id
  let body = request.body
  body.path = removeClosePointsBack(body.path)
  Line.updateOne({ 'route._id': id }, { $set: { 'route.$': body } })
    .then(data => {
      if (data.matchedCount === 0)
        response.status(404).json({
          status: 404,
          message: 'Segment does not exists'
        })
      else if (data.modifiedCount === 1)
        response.json({
          status: 200,
          message: 'Segment patched successfully'
        })
      else
        response.status(404).json({
          status: 404,
          message: 'There was an error updating the segment'
        })
    })
    .catch(err => response.json(err))
})

app.patch('/line', (request, response) => {
  let lineID = request.query.id
  let body = request.body
  let fromID = body.from.id
  let toID = body.to.id
  body.path = removeClosePointsBack(body.path)

  segmentExists(lineID, fromID, toID).then(data => {
    if (typeof data !== 'undefined')
      response.status(409).json({
        status: 409,
        message: 'Segment exists already'
      })
    else {
      const attributeOrder = new Promise((resolve, reject) => {
        if (typeof body.order === 'undefined')
          findLengthOfLine(lineID).then(data => {
            body.order = data + 1
            resolve('foo')
          })
        else resolve('foo')
      })
      attributeOrder.then(() => {
        if (typeof body.order !== 'undefined') {
          console.log(body)
          Line.updateOne({ _id: lineID }, { $push: { route: body } })
            .then(data => {
              if (data.modifiedCount === 1)
                response.json({
                  status: 200,
                  message: 'Segment pushed successfully'
                })
            })
            .catch(err => response.json(err))
        }
      })
    }
  })
})

// Delete a station by ID
app.delete('/stations/:id', (request, response) => {
  let id = request.params.id
  stationExists(id).then(exists => {
    if (exists)
      Station.findByIdAndDelete(id)
        .then(() =>
          response.json({
            status: 200,
            message: 'Station deleted successfully'
          })
        )
        .catch(err => response.json(err))
    else {
      response.status(404).json({
        status: 404,
        message: 'Station does not exists'
      })
    }
  })
})

//TODO: Decrement the order of the segments with higher order ($gt)
//Delete a segment
app.delete('/segment/:lineID/:segmentID', (request, response) => {
  let lineID = request.params.lineID
  let segmentID = request.params.segmentID
  segmentIdExists(lineID, segmentID).then(exists => {
    if (exists) {
      Line.updateOne(
        {
          _id: lineID
        },
        { $pull: { route: { _id: segmentID } } }
      )
        .then(data => {
          if (data.modifiedCount === 1)
            response.json({
              status: 200,
              message: 'Segment deleted successfully'
            })
          else
            response.status(404).json({
              status: 404,
              message: 'There was an error deleting the segment'
            })
        })
        .catch(err => {
          response.json(err)
          console.log(err)
        })
    } else
      response.status(404).json({
        status: 404,
        message: 'Segment does not exists'
      })
  })
})

//Delete station of a segment
app.delete('/lines/station/:id', (request, response) => {
  let id = request.params.id
  Line.aggregate([
    {
      $match: {
        $or: [{ 'route.from.id': id }, { 'route.to.id': id }]
      }
    },
    { $unwind: '$route' },
    {
      $match: {
        $or: [{ 'route.from.id': id }, { 'route.to.id': id }]
      }
    }
  ]).then(data => {
    if (data.length === 1) {
      //Remove the only segment related to the station (i.e: Terminus stations)
      Line.updateOne({ _id: data[0]._id }, { $pull: { route: { _id: data[0].route._id } } })
        .then(() =>
          response.json({
            status: 200,
            message: 'The segment that had the station was deleted successfully'
          })
        )
        .catch(err => response.json(err))
    } else if (data.length === 2) {
      let newPath = []
      let firstPath = [...data[0].route.path]
      let secondPath = [...data[1].route.path]
      secondPath.shift()
      newPath = [...firstPath, ...secondPath]
      newPath = removeClosePointsBack(newPath)

      let newSegment = {
        from: data[0].route.from,
        to: data[1].route.to,
        path: newPath,
        order: data[0].route.order
      }
      //Remove the second segment and update the first so that: newSegment = oldFirstSegment+oldSecondSegment
      Line.updateOne({ _id: data[1]._id }, { $pull: { route: { _id: data[1].route._id } } }).then(
        () => {
          Line.updateOne({ 'route._id': data[0].route._id }, { $set: { 'route.$': newSegment } })
            .then(() =>
              response.json({
                status: 200,
                message: 'Both segments that had the station were deleted successfully'
              })
            )
            .catch(err => response.json(err))
        }
      )
    } else if (data.length === 0)
      response.status(404).json({
        status: 404,
        message: 'No segment has that station as FROM or TO'
      })
    else
      response.status(405).json({
        status: 405,
        message: 'This stationis part of more than 2 segments'
      })
  })
})

// Line.find(
//   { _id: '61eb346037662c08a15b852f', 'route.order': 2 },
//   { route: { $elemMatch: { order: 2 } } }
// ).then(data => console.log(data))

// async function getHigherOrderSegments(lineID, order) {
//   // Line.aggregate([
//   //   { $match: { _id: lineID } },
//   //   { $unwind: '$route' },
//   //   { $match: { 'route.order': { $gt: order } } },
//   //   { $group: { _id: '$_id', route: { $push: '$route' } } }
//   // ])

//   let pipeline = [
//     {
//       $match: {
//         _id: ObjectId(lineID)
//       }
//     },
//     {
//       $unwind: '$route'
//     },
//     {
//       $match: {
//         'route.order': {
//           $gt: order
//         }
//       }
//     },
//     {
//       $group: {
//         _id: '$id',
//         route: {
//           $push: '$route'
//         }
//       }
//     }
//   ]
//   const response = await Line.aggregate(pipeline)
//   response[0].route.forEach(item => console.log(item))
//   return response
// }
// let a = getHigherOrderSegments('62044e699f5e3c1f32cdf755', 2)
