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

async function From_or_ToExists(lineID, fromID, toID) {
  const request = await Line.aggregate([{ $match: { _id: ObjectId(lineID), $or: [{ 'route.from.id': fromID }, { 'route.to.id': toID }] } }, { $unwind: '$route' }, { $match: { $or: [{ 'route.from.id': fromID }, { 'route.to.id': toID }] } }, { $group: { _id: '$_id', route: { $push: '$route' } } }])
  if (request.length > 0) return true
  return false
}

async function findLengthOfLine(lineID) {
  const response = await Line.find({ _id: lineID })
  const data = response[0].route.length
  return data
}

async function segmentWithSameOrder(lineID, order) {
  const response = await Line.find({ _id: lineID, 'route.order': order })
  if (response.length > 0) return true
  return false
}

async function orderOfSegment(lineID, segmentID) {
  const response = await Line.find({ _id: ObjectId(lineID), 'route._id': ObjectId(segmentID) }, { route: { $elemMatch: { _id: ObjectId(segmentID) } } })
  if (response.length > 0) return response[0].route[0].order
  return false
}

async function updateOrder(lineID, order, value) {
  const request = await Line.updateOne(
    { _id: ObjectId(lineID) },
    { $inc: { 'route.$[elem].order': value } },
    {
      multi: true,
      arrayFilters: [{ 'elem.order': { $gt: order } }],
    }
  )
  console.log(request)
  return request
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
  for (let i = 0; i < path.length - 2; i++) if (distance(path[i].latitude, path[i].longitude, path[i + 1].latitude, path[i + 1].longitude) < 4.5) path.splice(i + 1, 1)

  if (distance(path[path.length - 2].latitude, path[path.length - 2].longitude, path[path.length - 1].latitude, path[path.length - 1].longitude) < 4.5) path.splice(path.length - 2, 1)

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
        message: 'Station already exists in this line',
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
  Line.aggregate([{ $match: { name: name } }, { $unwind: '$route' }, { $sort: { 'route.order': 1 } }, { $group: { _id: '$_id', route: { $push: '$route' } } }])
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
        route: route,
      })
    })
    .catch(err => response.json(err))
})

app.get('/lines/:line/stations', (request, response) => {
  let name = request.params.line
  Line.aggregate([{ $match: { name: name } }, { $unwind: '$route' }, { $sort: { 'route.order': 1 } }, { $group: { _id: '$_id', route: { $push: '$route' } } }])
    .then(data => {
      let line = []
      let fromStations = []
      let toStations = []
      data[0].route.forEach(item => {
        let from = { coordinates: item.from.coordinates, name: item.from.name, id: item.from.id }
        let to = { coordinates: item.to.coordinates, name: item.to.name, id: item.to.id }
        let order = item.order
        fromStations.push(from)
        toStations.push(to)
        let segment = {
          from: from,
          to: to,
          order: order,
        }
        line.push(segment)
      })
      let result = {
        from: fromStations,
        to: toStations,
        line: line,
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
    .then(data => {
      if (data.length > 0)
        response.json({
          from: data[0].route[0].from,
          to: data[0].route[0].to,
          path: data[0].route[0].path,
          order: data[0].route[0].order,
          id: data[0].route[0]._id,
          line: line,
        })
      else
        response.json({
          status: 404,
          message: 'Inexistant segment',
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
          message: 'Station updated successfully',
        })
      else
        response.status(404).json({
          status: 404,
          message: 'Station not found',
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
          message: 'Segment does not exists',
        })
      else if (data.modifiedCount === 1)
        response.json({
          status: 200,
          message: 'Segment patched successfully',
        })
      else
        response.status(404).json({
          status: 404,
          message: 'There was an error updating the segment',
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

  From_or_ToExists(lineID, fromID, toID).then(exists => {
    if (exists)
      response.status(409).json({
        status: 409,
        message: 'Segment exists already',
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
        segmentWithSameOrder(lineID, body.order).then(data => {
          if (data)
            updateOrder(lineID, body.order - 1, 1).then(() => {
              Line.updateOne({ _id: lineID }, { $push: { route: body } })
                .then(data => {
                  if (data.modifiedCount === 1)
                    response.json({
                      status: 200,
                      message: 'Segment pushed successfully 1',
                    })
                })
                .catch(err => response.json(err))
            })
          else
            Line.updateOne({ _id: lineID }, { $push: { route: body } })
              .then(data => {
                if (data.modifiedCount === 1)
                  response.json({
                    status: 200,
                    message: 'Segment pushed successfully 2',
                  })
              })
              .catch(err => response.json(err))
        })
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
            message: 'Station deleted successfully',
          })
        )
        .catch(err => response.json(err))
    else {
      response.status(404).json({
        status: 404,
        message: 'Station does not exists',
      })
    }
  })
})

//Delete a segment
app.delete('/segment/:lineID/:segmentID', (request, response) => {
  let lineID = request.params.lineID
  let segmentID = request.params.segmentID
  orderOfSegment(lineID, segmentID).then(exists => {
    if (exists) {
      updateOrder(lineID, exists, -1)
        .then(() => Line.updateOne({ _id: lineID }, { $pull: { route: { _id: segmentID } } }))
        .then(data => {
          if (data.modifiedCount === 1)
            response.json({
              status: 200,
              message: 'Segment deleted successfully',
            })
          else
            response.status(404).json({
              status: 404,
              message: 'There was an error deleting the segment',
            })
        })
        .catch(err => {
          response.json(err)
          console.log(err)
        })
    } else
      response.status(404).json({
        status: 404,
        message: 'Segment does not exists',
      })
  })
})

//Delete station of a segment
app.delete('/lines/:lineID/station/:stationID', (request, response) => {
  let lineID = request.params.lineID
  let stationID = request.params.stationID
  Line.aggregate([
    {
      $match: {
        _id: ObjectId(lineID),
        $or: [{ 'route.from.id': stationID }, { 'route.to.id': stationID }],
      },
    },
    { $unwind: '$route' },
    {
      $match: {
        $or: [{ 'route.from.id': stationID }, { 'route.to.id': stationID }],
      },
    },
  ]).then(data => {
    if (data.length === 1) {
      updateOrder(lineID, data[0].route.order, -1).then(() =>
        Line.updateOne({ _id: data[0]._id }, { $pull: { route: { _id: data[0].route._id } } })
          .then(() =>
            response.json({
              status: 200,
              message: 'The segment that had the station was deleted successfully',
            })
          )
          .catch(err => response.json(err))
      )
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
        order: data[0].route.order,
      }
      updateOrder(lineID, newSegment.order, -1).then(() =>
        Line.updateOne({ _id: data[1]._id }, { $pull: { route: { _id: data[1].route._id } } }).then(() => {
          Line.updateOne({ 'route._id': data[0].route._id }, { $set: { 'route.$': newSegment } })
            .then(() =>
              response.json({
                status: 200,
                message: 'Both segments that had the station were deleted successfully',
              })
            )
            .catch(err => response.json(err))
        })
      )
    } else if (data.length === 0)
      response.status(404).json({
        status: 404,
        message: 'No segment has that station as FROM or TO',
      })
    else
      response.status(405).json({
        status: 405,
        message: 'This station is part of more than 2 segments',
      })
  })
})

//Delete a line by its name
app.delete('/line/:name', async (request, response) => {
  let lineName = request.params.name
  let [deleteLine, deleteStation] = await Promise.all([Line.deleteOne({ name: lineName }), Station.deleteMany({ line: lineName })])
  response.json({
    line: deleteLine,
    stations: deleteStation,
  })
})

function calculateDistanceSegment(path) {
  let result = 0
  for (let i = 0; i < path.length - 1; i++) result += distance(path[i].latitude, path[i].longitude, path[i + 1].latitude, path[i + 1].longitude)
  return result
}

/* const speed = (1000 / 3600) * 21
Line.findOne({ name: 'tramway' }).then(data => {
  data.route.forEach(segment => {
    let distance = Math.ceil(calculateDistanceSegment(segment.path))
    Line.updateOne(
      {
        name: 'tramway',
      },
      {
        $set: {
          'route.$[segment].distance': distance,
          'route.$[segment].duration': Math.ceil(distance / speed) + 20,
        },
      },
      { arrayFilters: [{ 'segment._id': segment._id }] }
    ).then(data => console.log(data.modifiedCount))
  })
}) */
