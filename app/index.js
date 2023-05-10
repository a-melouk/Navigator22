process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const axios = require('axios')
const cors = require('cors')
const Models = require('./Models/line')
const { ObjectId } = require('mongodb')

const Line = Models.Line
const Station = Models.Station
const LineMatrix = Models.LineMatrix
const Route = Models.Route
require('dotenv').config()

//express app
const app = express()
app.use(bodyParser.json())
app.use(cors())
const path = require('path')
app.use(express.static(path.join(__dirname, '/frontend')))
const mongoDB = process.env.MONGO_URL
const PORT = process.env.PORT || 4000
mongoose
  .connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, '0.0.0.0')
    console.log(`Running on port ${PORT}`)
  })
//
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
        line: name,
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
        fromStations.push(from)
        toStations.push(to)
        let segment = {
          from: from,
          to: to,
          order: item.order,
          distance: item.distance,
          duration: item.duration,
          id: item._id,
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

app.get('/schedule/:line', (request, response) => {
  let name = request.params.line
  LineMatrix.aggregate([{ $match: { name: name } }, { $unwind: '$route' }, { $sort: { 'route.transport.order': 1 } }, { $group: { _id: '$_id', route: { $push: '$route' } } }])
    .then(data => {
      let line = []
      let fromStations = []
      let toStations = []
      data[0].route.forEach(item => {
        let from = { id: item.from.id, name: item.from.name, coordinates: item.from.coordinates }
        let to = { id: item.to.id, name: item.to.name, coordinates: item.to.coordinates }
        fromStations.push(from)
        toStations.push(to)
        let segment = {
          from: from,
          to: to,
          order: item.transport.order,
          distance: item.transport.distance,
          duration: item.transport.duration,
          id: item._id,
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

app.patch('/duration', (request, response) => {
  let id = request.query.id
  let body = request.body
  const promise = new Promise((resolve, reject) => {
    for (let i = 0; i < body.length; i++) {
      LineMatrix.updateOne({ line_id: ObjectId(id), 'route._id': body[i].segment_id }, { $set: { 'route.$.transport.duration': body[i].duration } }).then(data => {
        if (data.matchedCount === 0) reject('Line does not exist')
        else if (data.modifiedCount === 1) console.log('Patched ' + (i + 1))
        else reject('There was an error updating the segment')
        if (i === body.length - 1) resolve(i + 1 + 'segments have been patched successfully')
      })
    }
  })
  promise
    .then(data => {
      console.log('finished updating ' + data)
      response.json({
        status: 200,
        message: data,
      })
    })
    .catch(err => {
      console.log(err)
      response.status(404).json({
        status: 404,
        message: err,
      })
    })
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

function updateTransportDurations(line) {
  const speed = (1000 / 3600) * 14
  LineMatrix.findOne({ name: line }).then(data => {
    data.route.forEach(segment => {
      let distance = Math.ceil(calculateDistanceSegment(segment.transport.path))
      LineMatrix.updateOne({ name: line, 'route._id': segment._id }, { $set: { 'route.$.transport.duration': Math.ceil(distance / speed) } }).then(data => console.log(data))
    })
  })
}

function transform(array) {
  let result = []
  array.forEach(item => {
    let point = {
      latitude: precise(item[1]),
      longitude: precise(item[0]),
    }
    result.push(point)
  })
  return result
}

// const GraphHopperRouting = require('graphhopper-js-api-client/src/GraphHopperRouting')
// const GHInput = require('graphhopper-js-api-client/src/GHInput')
// const profile = 'foot'
// const ghRouting = new GraphHopperRouting({
//   key: process.env.GRAPHHOPPER_KEY,
//   vehicle: profile,
//   locale: 'fr',
//   elevation: false,
// })

async function addMatrix(nameOfTheLine) {
  return new Promise((resolve, reject) => {
    let route = []
    Line.find({ name: nameOfTheLine })
      .then(async lineData => {
        for (let i = 0; i < lineData[0].route.length; i++) {
          let item = lineData[0].route[i]
          ghRouting.clearPoints()
          let from = item.from
          let to = item.to
          ghRouting.addPoint(new GHInput(from.coordinates.latitude, from.coordinates.longitude))
          ghRouting.addPoint(new GHInput(to.coordinates.latitude, to.coordinates.longitude))
          let data = await ghRouting.doRequest()
          let segment = {
            from: item.from,
            to: item.to,
            _id: item._id,
            transport: {
              order: item.order,
              distance: item.distance,
              duration: item.duration,
              path: item.path,
            },
            walk: {
              distance: Math.ceil(data.paths[0].distance),
              duration: Math.ceil(data.paths[0].time / 1000),
              path: transform(data.paths[0].points.coordinates),
            },
          }
          route.push(segment)
          if (i + 1 === lineData[0].route.length) {
            let body = {
              name: nameOfTheLine,
              route: route,
            }
            const lineMatrix = new LineMatrix(body)
            lineMatrix
              .save()
              .then(() => resolve('Inserted ' + nameOfTheLine))
              .catch(err => console.log(err))
          }
        }
      })
      .catch(err => console.log('Error fetching lines ' + err))
  })
}

/*Station.find({}).then(data => {
  console.log('STARTED')
  console.log(data)
})*/

function precise(number) {
  return Number(Number.parseFloat(number).toFixed(5))
}

async function routesWalk(line) {
  let count = 1
  const station = await Station.find({ line: { $nin: ['tramway retour'] } })
  for (let i = 0; i < station.length; i++) {
    const from = station[i]
    const promiseFrom = new Promise(async (resolve, reject) => {
      const stations = await Station.find({ line: { $nin: ['tramway retour'] } })
      const promises = []
      for (let j = 0; j < stations.length; j++) {
        promises.push(
          new Promise(async (resolve, reject) => {
            const to = stations[j]
            axios.default.get('https://graphhopper.com/api/1/route?profile=foot&point=' + from.coordinates.latitude + ',' + from.coordinates.longitude + '&point=' + to.coordinates.latitude + ',' + to.coordinates.longitude + '&locale=fr&calc_points=true&instructions=false&points_encoded=true&key=' + process.env.GRAPHHOPPER_KEY).then(res => {
              let response = res.data
              let route = {
                name: to.name,
                coordinates: {
                  latitude: to.coordinates.latitude,
                  longitude: to.coordinates.longitude,
                },
                line: to.line,
                station_id: to._id,
                distance: Math.ceil(response.paths[0].distance),
                duration: Math.ceil(response.paths[0].time / 1000),
                path: response.paths[0].points,
              }
              resolve(route)
            })
          })
        )
      }
      Promise.all(promises).then(data => {
        setTimeout(() => {
          let body = {
            name: from.name,
            coordinates: from.coordinates,
            line: from.line,
            station_id: from._id,
            route: data,
          }
          resolve(body)
        }, 10000)
      })
    })
    const data = await promiseFrom
    const stationToMatrix = new Route(data)
    stationToMatrix
      .save()
      .then(() => {
        count++
        console.log(count, 'Inserted matrix of ' + data.name + ' of ' + data.line)
      })
      .catch(err => console.log(err))
  }
}
// routesWalk('Ligne 03')

const util = require('./Dijkstra')
let Edge = util.Edge
let Graph = util.Graph
let Dijkstra = util.dijikstra
const GHUtil = require('graphhopper-js-api-client/src/GHUtil')
let Ghutil = new GHUtil()

async function shortest() {
  return new Promise((resolve, reject) => {
    const graph = new Graph(true)
    const promiseWalk = new Promise(async resolve => {
      const routesWalk = await Route.find({})
      for (let i = 0; i < routesWalk.length; i++) {
        let stationA = String(routesWalk[i].station_id)
        for (let j = 0; j < routesWalk[i].route.length; j++) {
          let stationB = String(routesWalk[i].route[j].station_id)
          graph.setEdge(
            Edge(stationA, stationB, routesWalk[i].route[j].duration, {
              from: {
                line: routesWalk[i].line,
                name: routesWalk[i].name,
                coordinates: routesWalk[i].coordinates,
              },
              to: {
                line: routesWalk[i].route[j].line,
                name: routesWalk[i].route[j].name,
                coordinates: routesWalk[i].route[j].coordinates,
              },
              path: transform(Ghutil.decodePath(routesWalk[i].route[j].path, false)),
              // path: routesWalk[i].route[j].path,
              mean: 'walk',
              distance: routesWalk[i].route[j].distance,
            })
          )
          if (i + 1 === routesWalk.length && j + 1 === routesWalk[i].route.length) resolve('Walk matrix done')
        }
      }
    })

    Promise.all([promiseWalk]).then(() => resolve(graph))
  })
}

/*
61eb2de817e57cb86cb3f8f9 Les cascades
61eb2de817e57cb86cb3f906 Daira
61eb2de817e57cb86cb3f90c 4 Horloges
*/

let matrixWithWalk
shortest().then(graph => {
  matrixWithWalk = graph
  console.log('Done initialising walk matrix')
})

app.get('/route', async (request, response) => {
  const from = request.query.from
  const to = request.query.to
  const mean = request.query.mean
  let matrixCopy = new Graph(true)
  matrixCopy.edges = [...matrixWithWalk.edges]
  matrixCopy.nodes = [...matrixWithWalk.nodes]
  if (mean === 'bus' || mean === 'tramway' || mean === 'fastest' || mean === 'walk') {
    fillTransport(matrixCopy, mean)
      .then(finalMatrix => (matrixCopy = finalMatrix))
      .then(() => {
        let solution = removeSuccessiveWalk(Dijkstra(matrixCopy, from, to).find(item => item.to === to))
        let source = JSON.parse(solution.path[0]).label.from
        let target = JSON.parse(solution.path[solution.path.length - 1]).label.to
        let duration = solution.cost
        let path = []
        solution.path.forEach(edge => {
          let parsed = JSON.parse(edge).label
          path.push({
            from: parsed.from,
            to: parsed.to,
            duration: JSON.parse(edge).weight,
            distance: parsed.distance,
            mean: parsed.mean,
            segment: parsed.path,
          })
        })
        response.json({
          from: source,
          to: target,
          length: path.length,
          duration: duration,
          mean: mean,
          path: path,
        })
      })
  } else if (mean === 'taxi') {
    const source = await Station.findById(from)
    const target = await Station.findById(to)
    let baseURL = 'https://graphhopper.com/api/1/route?profile=car'
    baseURL += '&point=' + source.coordinates.latitude + ',' + source.coordinates.longitude
    baseURL += '&point=' + target.coordinates.latitude + ',' + target.coordinates.longitude
    baseURL += '&locale=fr&calc_points=true&instructions=false&points_encoded=true&key=' + process.env.GRAPHHOPPER_KEY
    axios.default.get(baseURL).then(res => {
      let GHresponse = res.data
      response.json({
        from: source.name,
        to: target.name,
        duration: Math.ceil(GHresponse.paths[0].time / 1000),
        distance: Math.ceil(GHresponse.paths[0].distance),
        mean: 'taxi',
        path: transform(Ghutil.decodePath(GHresponse.paths[0].points, false)),
      })
    })
  }
})

function checkDoubleWalk(solution) {
  for (let i = 0; i < solution.path.length - 1; i++) {
    let a = JSON.parse(solution.path[i])
    let b = JSON.parse(solution.path[i + 1])
    if (a.label.mean === 'walk' && b.label.mean === 'walk') return true
  }
  return false
}

function removeSuccessiveWalk(solution) {
  while (checkDoubleWalk(solution)) {
    console.log('again')
    let result = []
    for (let i = 0; i < solution.path.length - 1; i++) {
      let a = JSON.parse(solution.path[i])
      let b = JSON.parse(solution.path[i + 1])
      if (a.label.mean === 'walk' && b.label.mean === 'walk') {
        a.label.path.pop()
        let newSegment = {
          from: a.from,
          to: b.to,
          weight: a.weight + b.weight,
          label: {
            from: a.label.from,
            to: b.label.to,
            path: [...a.label.path, ...b.label.path],
            mean: 'walk',
            distance: a.label.distance + b.label.distance,
          },
        }
        result.push(JSON.stringify(newSegment), ...solution.path.slice(i + 2))
      }
      solution.path = result
    }
  }
  return solution
}

function fillTransport(graph, mean) {
  return new Promise(async resolve => {
    let matrixTransport
    if (mean === 'walk') resolve(graph)
    else {
      if (mean === 'fastest') matrixTransport = await LineMatrix.find({})
      else if (mean === 'bus' || mean === 'tramway') matrixTransport = await LineMatrix.find({ type: mean })
      for (let i = 0; i < matrixTransport.length; i++) {
        let route = matrixTransport[i].route
        for (let j = 0; j < route.length; j++) {
          let stationA = String(route[j].from.id)
          let stationB = String(route[j].to.id)
          graph.setEdge(
            Edge(stationA, stationB, route[j].transport.duration, {
              from: {
                line: matrixTransport[i].name,
                name: route[j].from.name,
                coordinates: route[j].from.coordinates,
              },
              to: {
                line: matrixTransport[i].name,
                name: route[j].to.name,
                coordinates: route[j].to.coordinates,
              },
              path: route[j].transport.path,
              mean: matrixTransport[i].name,
            })
          )
          graph.setEdge(
            Edge(stationB, stationA, route[j].transport.duration, {
              from: {
                line: matrixTransport[i].name,
                name: route[j].to.name,
                coordinates: route[j].to.coordinates,
              },
              to: {
                line: matrixTransport[i].name,
                name: route[j].from.name,
                coordinates: route[j].from.coordinates,
              },
              path: route[j].transport.path,
              mean: matrixTransport[i].name,
            })
          )
          if (i + 1 === matrixTransport.length && j + 1 === route.length) resolve(graph)
        }
      }
    }
  })
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/frontend/index.html'))
})

// All the general routes of your
// web app are defined above the
// default route

// Default route
app.get('*', (req, res) => {
  // Here user can also design an
  // error page and render it
  res.send('PAGE NOT FOUND')
})
