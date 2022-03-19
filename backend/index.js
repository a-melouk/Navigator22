process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const Models = require('./Models/line')
const { ObjectId } = require('mongodb')
const graphlib = require('graphlib')
const ksp = require('k-shortest-path')

const Line = Models.Line
const Station = Models.Station
const LineMatrix = Models.LineMatrix
const Route = Models.Route
require('dotenv').config()

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
      Line.updateOne({ _id: ObjectId(id), 'route._id': body[i].segment_id }, { $set: { 'route.$.duration': body[i].duration } }).then(data => {
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

app.get('/route', (request, response) => {
  const from = request.query.from
  const to = request.query.to
  Route.find({ station_id: ObjectId(from), 'route.station_id': ObjectId(to) }, { name: 1, coordinates: 1, line: 1, station_id: 1, route: { $elemMatch: { station_id: ObjectId(to) } } }).then(data => {
    if (data.length !== 1)
      response.status(404).json({
        status: 404,
        message: 'Error retrieving data',
      })
    else {
      let result = {
        from: {
          station_id: data[0].station_id,
          line: data[0].line,
          name: data[0].name,
          coordinates: data[0].coordinates,
        },
        to: {
          station_id: data[0].route[0].station_id,
          line: data[0].route[0].line,
          name: data[0].route[0].name,
          coordinates: data[0].route[0].coordinates,
        },
        distance: data[0].route[0].distance,
        duration: data[0].route[0].duration,
        path: data[0].route[0].path,
      }
      response.json(result)
    }
  })
})

function calculateDistanceSegment(path) {
  let result = 0
  for (let i = 0; i < path.length - 1; i++) result += distance(path[i].latitude, path[i].longitude, path[i + 1].latitude, path[i + 1].longitude)
  return result
}

/* const speed = (1000 / 3600) * 21
Line.findOne({ name: 'metro' }).then(data => {
  data.route.forEach(segment => {
    let distance = Math.ceil(calculateDistanceSegment(segment.path))
    Line.updateOne(
      {
        name: 'metro',
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
/*
const GraphHopperRouting = require('graphhopper-js-api-client/src/GraphHopperRouting')
const GHInput = require('graphhopper-js-api-client/src/GHInput')
const profile = 'foot'

const ghRouting = new GraphHopperRouting({
  key: process.env.GRAPHHOPPER_KEY,
  vehicle: profile,
  locale: 'fr',
  elevation: false,
})
*/

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

// Line.find({}, { name: 1, _id: 0 }).then(data => {
//   console.log('STARTED')
//   for (let i = 0; i < data.length; i++) addMatrix(data[i].name).then(line => console.log(line))
// })

function precise(number) {
  return Number(Number.parseFloat(number).toFixed(5))
}

const axios = require('axios')

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
          // console.log(data)
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

function shortest(from, to, k) {
  let graph = new graphlib.Graph({ multigraph: true, directed: true })
  let a = Date.now()
  const promiseWalk = new Promise(async (resolve, reject) => {
    const routesWalk = await Route.find({}, { 'route.path': 0 })
    // const routesWalk = await Route.find({})
    for (let i = 0; i < routesWalk.length; i++) {
      let stationA = routesWalk[i].station_id
      for (let j = 0; j < routesWalk[i].route.length; j++) {
        let stationB = routesWalk[i].route[j].station_id
        graph.setEdge(stationA, stationB, routesWalk[i].route[j].duration, 'walk_' + routesWalk[i].name + '_' + routesWalk[i].route[j].name)
        if (i + 1 === routesWalk.length && j + 1 === routesWalk[i].route.length) resolve('Walk matrix done')
      }
    }
  })

  promiseWalk.then(() => {
    const promiseTransport = new Promise(async (resolve, reject) => {
      const matrixTransport = await LineMatrix.find({}, { 'route.transport.path': 0, 'route.walk.path': 0 })
      // const matrixTransport = await LineMatrix.find({})
      for (let i = 0; i < matrixTransport.length; i++) {
        let route = matrixTransport[i].route
        for (let j = 0; j < route.length; j++) {
          let stationA = route[j].from.id
          let stationB = route[j].to.id
          graph.setEdge(stationA, stationB, route[j].transport.duration, matrixTransport[i].name + '_' + route[j].from.name + '_' + route[j].to.name)
          graph.setEdge(stationB, stationA, route[j].transport.duration, matrixTransport[i].name + '_' + route[j].to.name + '_' + route[j].from.name)
          if (i + 1 === matrixTransport.length && j + 1 === route.length) resolve('Transport matrix done')
        }
      }
    })
    promiseTransport.then(() => {
      // console.table(graph.edges())
      let shortestPaths = ksp.ksp(graph, from, to, k)
      console.log(Date.now() - a)
      console.log(JSON.stringify(shortestPaths, null, 3))
    })
  })

  // Promise.all([promiseWalk, promiseTransport]).then(() => {
  // Promise.all([promiseTransport, promiseWalk]).then(() => {})
}

/*
61eb2de817e57cb86cb3f8f9  Les cascades
61eb2de817e57cb86cb3f906  Daira
61eb2de817e57cb86cb3f90c  4 Horloges

*/
// shortest('61eb2de817e57cb86cb3f906', '61eb2de817e57cb86cb3f90c', 3)

// Route.updateMany({ 'route.line': 'tramway retour' }, { $pull: { route: { line: 'tramway retour' } } }).then(data => console.log(data))
// Route.updateMany({ 'route.line': 'metro' }, { $pull: { route: { line: 'metro' } } }).then(data => console.log(data))
let graph = new graphlib.Graph({ multigraph: true, directed: true })
graph.setEdge('1', '2', 2, '1')
graph.setEdge('1', '5', 13, '2')
graph.setEdge('1', '5', 18, '22')

graph.setEdge('2', '3', 20, '3')
graph.setEdge('2', '6', 27, '4')

graph.setEdge('3', '4', 14, '5')
graph.setEdge('3', '7', 14, '6')

graph.setEdge('4', '8', 15, '7')

graph.setEdge('5', '6', 9, '8')
graph.setEdge('5', '9', 15, '9')

graph.setEdge('6', '7', 10, '10')
graph.setEdge('6', '10', 20, '11')

graph.setEdge('7', '8', 25, '12')
graph.setEdge('7', '8', 29, '129')
graph.setEdge('7', '11', 12, '13')

graph.setEdge('8', '12', 7, '14')

graph.setEdge('9', '10', 18, '15')

graph.setEdge('10', '11', 8, '16')

graph.setEdge('11', '12', 11, '17')
// let dij = graphlib.alg.dijkstra(
//   graph,
//   '1',
//   edge => graph.edge(edge),
//   edge => graph.outEdges(edge)
// )
// console.log(dij)

// let s = ksp.ksp(graph, '1', '12', 3)

// s.forEach(item => console.log(item))
async function a() {
  let tramway = ['La Poste Cpr, Les Cascades', 'Ghalmi Gare Routiere Est', 'Les Freres Adnane', 'Benhamouda']
  let ligne16 = ['La Poste Cpr, Les Cascades', 'Ghalmi Gare Routiere Est', 'Les Freres Adnane', 'Benhamouda']
  let data = await Route.find()
  //max is maximum number of seconds to walk
  let max = 60 * 20
  let result = []
  data.forEach(station => {
    station.route.forEach(item => {
      // if (item.duration < max && (item.line !== station.line || item.name !== station.name) && station.line === 'Ligne 03' && item.line === 'tramway') {
      if ((item.line !== station.line || item.name !== station.name) && (station.line === 'Ligne 16' || station.line === 'tramway') && (item.line === 'tramway' || item.line === 'Ligne 16') && ligne16.includes(station.name) && tramway.includes(item.name)) {
        result.push({
          from: station.name,
          to: item.name,
          a: station.line,
          b: item.line,
          // duration: Math.ceil(item.duration / 60),
          duration: item.duration,
          path: item.path,
        })
      }
    })
  })
  return result
}
let b = async () => {
  let res = await a()
  // console.table(res)
  console.table(res.sort((a, b) => a.duration - b.duration))
}

b()
//TODO: find closest tramway stations to every bus station
const Edge = (from, to, weight, label) => {
  let edge = {
    from: from,
    to: to,
    weight: weight,
  }
  if (label) edge.label = label
  return edge
}

function otherNodes(allNodes, visited, reached) {
  let merge = [...visited, ...reached]
  return allNodes.filter(x => !merge.includes(x))
}

function outEdgesTos(edges, node) {
  let result = []
  edges.forEach(edge => {
    if (edge.from === node) if (!result.includes(edge.to)) result.push(edge.to)
  })
  return result
}

const sortByToName = (a, b) => {
  let fa = a.to.toLowerCase(),
    fb = b.to.toLowerCase()

  if (fa < fb) {
    return -1
  }
  if (fa > fb) {
    return 1
  }
  return 0
}

function minimalEdge(edges) {
  let min = Number.POSITIVE_INFINITY
  let temp
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].weight < min) {
      min = edges[i].weight
      temp = edges[i]
    }
  }
  return temp
}

function getEdgeByTarget(edges, target) {
  return edges.filter(x => x.to === target)
}

function getEdgeBySource(edges, source) {
  return edges.filter(x => x.from === source)
}

function indexOfEdge(edges, edge) {
  for (let i = 0; i < edges.length; i++) if (edges[i].from === edge.from && edges[i].to === edge.to) return i
  return -1
}

/*
class Graph {
  constructor(directed) {
    this.nodes = []
    this.edges = []
    this.directed = directed
  }

  setEdge(edge) {
    if (!this.nodes.includes(edge.from)) this.nodes.push(edge.from)
    if (!this.nodes.includes(edge.to)) this.nodes.push(edge.to)
    this.edges.push(edge)
    if (!this.directed) this.edges.push(Edge(edge.to, edge.from, edge.weight, edge.label))
  }

  neighbours(node) {
    let result = []
    this.edges.forEach(edge => {
      if (edge.from === node || edge.to === node) result.push(edge)
    })
    return result
  }

  outEdges(node) {
    let result = []
    this.neighbours(node).forEach(neighbour => {
      if (neighbour.from === node) result.push(neighbour)
    })
    return result
  }

  inEdges(node) {
    let result = []
    this.neighbours(node).forEach(neighbour => {
      if (neighbour.to === node) result.push(neighbour)
    })
    return result
  }

  getEdge(from, to) {
    return g.edges.filter(edge => edge.from === from && edge.to === to)
  }
}

function compareEdge(edge1, edge2) {
  if (edge1.weight <= edge2.weight) return edge1
  else return edge2
}

let g = new Graph(true)

const source = 'tramway_ghalmi'
g.setEdge(Edge('tramway_ghalmi', 'tramway_adnane', 501, 'walk'))
g.setEdge(Edge('tramway_ghalmi', 'tramway_benhamouda', 845, 'walk'))
g.setEdge(Edge('tramway_ghalmi', '16_ghalmi', 21, 'walk'))
g.setEdge(Edge('tramway_ghalmi', '16_cascades', 332, 'walk'))
g.setEdge(Edge('tramway_adnane', 'tramway_benhamouda', 447, 'walk'))
g.setEdge(Edge('tramway_adnane', '16_ghalmi', 503, 'walk'))
g.setEdge(Edge('tramway_adnane', '16_cascades', 814, 'walk'))
g.setEdge(Edge('tramway_benhamouda', '16_ghalmi', 847, 'walk'))
g.setEdge(Edge('tramway_benhamouda', '16_cascades', 1158, 'walk'))
g.setEdge(Edge('16_ghalmi', '16_cascades', 326, 'walk'))
g.setEdge(Edge('tramway_ghalmi', 'tramway_adnane', 112, 'tramway'))
g.setEdge(Edge('tramway_adnane', 'tramway_benhamouda', 120, 'tramway'))
g.setEdge(Edge('16_ghalmi', '16_cascades', 131, 'ligne_16'))

//init
let outEdges = g.outEdges(source)
outEdges = filterOutedgesDuplicates(outEdges)
let temp = []
let visited = [source]

let reached = outEdgesTos(outEdges, source)
let others = otherNodes(g.nodes, visited, reached)

function filterOutedgesDuplicates(outedges) {
  let result = []
  for (let j = 0; j < outedges.length; j++) {
    let b = outedges[j]
    let index = indexOfEdge(result, b)
    if (index === -1) result.push(b)
    else result[index] = compareEdge(result[index], b)
  }
  return result
}

outEdges.forEach(item => {
  let path = { from: source, to: item.to, weight: item.weight }
  if (item.label) path.label = item.label
  temp.push({
    from: source,
    to: item.to,
    cost: item.weight,
    path: [JSON.stringify(path)],
  })
})

others.forEach(item => {
  temp.push({
    from: source,
    to: item,
    cost: Number.POSITIVE_INFINITY,
    path: [],
  })
})

temp = temp.sort(sortByToName)
// Init step is over

function minimalNode(temp, reached) {
  let result = { cost: Number.POSITIVE_INFINITY }
  for (let i = 0; i < temp.length; i++) {
    for (let j = 0; j < reached.length; j++) {
      if (temp[i].to === reached[j]) {
        if (result.cost > temp[i].cost) result = temp[i]
      }
    }
  }
  return result
}

for (let i = 0; i < g.nodes.length; i++) {
  let minNode = minimalNode(temp, reached)
  visited.push(minNode.to)
  outEdges = g.outEdges(minNode.to)
  reached.splice(reached.indexOf(minNode.to), 1)
  for (let i = 0; i < outEdges.length; i++) if (!reached.includes(outEdges[i].to)) reached.push(outEdges[i].to)
  others = others.filter(x => !reached.includes(x))

  for (let i = 0; i < outEdges.length; i++) {
    for (let j = 0; j < temp.length; j++) {
      if (outEdges[i].to === temp[j].to) {
        let min1 = temp[j].cost
        let candidateEdge = outEdges[i]
        let candidatePath = [...minNode.path]
        candidatePath.push(JSON.stringify(candidateEdge))
        let min2 = minNode.cost + candidateEdge.weight
        if (min2 < min1) {
          temp[j] = {
            from: source,
            to: candidateEdge.to,
            cost: min2,
            path: candidatePath,
          }
        }
      }
    }
  }
}

temp.forEach(item => {
  console.log(item)
})
*/
