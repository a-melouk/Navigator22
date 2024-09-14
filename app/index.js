process.stdout.write('\x1Bc')

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const Models = require('./Models/line')
const { ObjectId } = require('mongodb')

const util = require('./utils/dijkstra')
let Graph = util.Graph
const GHUtil = require('graphhopper-js-api-client/src/GHUtil')
const { stationAlreadyExistsLine, From_or_ToExists, findLengthOfLine, segmentWithSameOrder, updateOrder, stationExists, orderOfSegment } = require('./utils/mongo')
const { removeClosePointsBack, calculateDistanceSegment, transform } = require('./utils/utils')

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

if (!mongoDB) {
  console.error('MONGO_URL is not defined in the environment variables')

  process.exit(1)
}

mongoose
  .connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, '0.0.0.0')
    console.log(`Running on port ${PORT}`)
  })

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

app.post('/lines', async (request, response) => {
  try {
    const body = request.body
    let order = 1
    body.route.forEach(segment => {
      segment.order = order
      segment.path = removeClosePointsBack(segment.path)
      order++
    })

    body.route = body.route.map((segment, index) => ({
      ...segment,
      from: { ...segment.from },
      to: { ...segment.to },
      order: index + 1,
      path: removeClosePointsBack(segment.path),
      length: 0,
      duration: 0,
      distance: calculateDistanceSegment(removeClosePointsBack(segment.path)),
    }))

    const newLine = new Line(body)
    await newLine.save()

    response.status(201).json(newLine)
  } catch (err) {
    response.status(400).json({ error: err.message })
  }
})

//Get station by ID
app.get('/station', (request, response) => {
  let id = request.query.id
  Station.findById(id)
    .then(data => response.json(data))
    .catch(err => response.json(err))
})

//Get station by name
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
    .then(data => {
      response.json(data)
    })
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
        let from = {
          name: item.from.name,
          coordinates: item.from.coordinates,
          id: item.from.id,
        }
        let to = {
          name: item.to.name,
          coordinates: item.to.coordinates,
          id: item.to.id,
        }
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

app.get('/segment', (request, response) => {
  let id = request.query.id

  Line.findOne({ 'route._id': id }, { route: { $elemMatch: { _id: id } }, _id: 0 })
    .then(data => {
      if (data && data.route && data.route.length > 0) {
        response.json(data.route[0])
      } else {
        response.status(404).json({ error: 'Segment not found' })
      }
    })
    .catch(err => response.status(500).json({ error: err.message }))
})

//Get segment by FROM station ID
app.get('/segment/from', async (request, response) => {
  let stationId = request.query.id
  try {
    const line = await Line.aggregate([{ $match: { 'route.from.id': stationId } }, { $unwind: '$route' }, { $match: { 'route.from.id': stationId } }, { $limit: 1 }, { $project: { _id: 0, segment: '$route' } }])

    if (line && line.length > 0) {
      response.json(line[0].segment)
    } else {
      response.status(404).json({ error: 'Segment not found' })
    }
  } catch (err) {
    response.status(500).json({ error: err.message })
  }
})

//Get segment by TO station ID
app.get('/segment/to', async (request, response) => {
  let id = request.query.id
  try {
    const line = await Line.aggregate([{ $match: { 'route.to.id': id } }, { $unwind: '$route' }, { $match: { 'route.to.id': id } }, { $limit: 1 }, { $project: { _id: 0, segment: '$route' } }])

    if (line && line.length > 0) {
      response.json(line[0].segment)
    } else {
      response.status(404).json({ error: 'Segment not found' })
    }
  } catch (err) {
    response.status(500).json({ error: err.message })
  }
})

//Get a segment that includes FROM & TO stations
app.get('/lines/:line', async (request, response) => {
  let line = request.params.line
  let fromID = request.query.from
  let toID = request.query.to

  try {
    const segment = await Line.aggregate([
      { $match: { name: line } },
      { $unwind: '$route' },
      {
        $match: {
          $or: [
            { 'route.from.id': fromID, 'route.to.id': toID },
            { 'route.from.id': toID, 'route.to.id': fromID },
          ],
        },
      },
      { $limit: 1 },
      { $project: { _id: 0, segment: '$route' } },
    ])

    if (segment && segment.length > 0) {
      const matchedSegment = segment[0].segment
      response.json({
        from: matchedSegment.from,
        to: matchedSegment.to,
        path: matchedSegment.path,
        order: matchedSegment.order,
        id: matchedSegment._id,
        line: line,
      })
    } else {
      response.status(404).json({ message: 'Inexistant segment' })
    }
  } catch (err) {
    response.status(500).json({ error: err.message })
  }
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

app.patch('/segment', (request, response) => {
  let id = request.query.id
  let body = request.body
  body.path = removeClosePointsBack(body.path)
  body._id = ObjectId(id)
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

let Ghutil = new GHUtil()

/*
61eb2de817e57cb86cb3f8f9 Les cascades
61eb2de817e57cb86cb3f906 Daira
61eb2de817e57cb86cb3f90c 4 Horloges
*/

app.get('/shortest-path', async (request, response) => {
  const fromID = request.query.from
  const toID = request.query.to
  const mean = request.query.mean

  if (mean === 'bus' || mean === 'tramway' || mean === 'fastest' || mean === 'walk') {
    const solution = await findShortestPath(fromID, toID)
    let source = solution.path[0].label.from
    let target = solution.path[solution.path.length - 1].label.to
    let duration = solution.cost
    let path = []
    let means = []
    solution.path.forEach(edge => {
      let parsed = edge.label
      path.push({
        from: parsed.from,
        to: parsed.to,
        duration: edge.weight,
        distance: parsed.distance,
        mean: parsed.mean,
        segment: parsed.mean === 'walk' ? transform(Ghutil.decodePath(parsed.path, false)) : parsed.path,
      })
      if (means.indexOf(parsed.mean) === -1) means.push(parsed.mean)
    })
    response.json({
      from: source,
      to: target,
      mean: mean,
      duration: duration,
      length: path.length,
      means: means,
      path: path,
    })
  } else if (mean === 'taxi') {
    const source = await Station.findById(fromID)
    const target = await Station.findById(toID)

    const baseURL = `https://graphhopper.com/api/1/route?profile=car&point=${source.coordinates.latitude},${source.coordinates.longitude}&point=${target.coordinates.latitude},${target.coordinates.longitude}&locale=fr&calc_points=true&instructions=false&points_encoded=true&key=${process.env.GRAPHHOPPER_KEY}`

    fetch(baseURL).then(async res => {
      let GHresponse = await res.json()
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/frontend/index.html'))
})

// Default route
app.get('*', (req, res) => {
  res.send('PAGE NOT FOUND')
})

async function createMatrix() {
  const graph = new Graph()

  // Add transport routes
  const transportLines = await Line.find().lean()

  transportLines.forEach(line => {
    line.route.forEach(segment => {
      const fromId = segment.from.id
      const toId = segment.to.id
      graph.addNode(fromId)
      graph.addNode(toId)
      graph.addEdge(fromId, toId, segment.duration, {
        from: { line: line.name, name: segment.from.name, coordinates: segment.from.coordinates },
        to: { line: line.name, name: segment.to.name, coordinates: segment.to.coordinates },
        path: segment.path,
        mean: line.name,
        distance: segment.distance,
      })

      graph.addEdge(toId, fromId, segment.duration, {
        from: { line: line.name, name: segment.to.name, coordinates: segment.to.coordinates },
        to: { line: line.name, name: segment.from.name, coordinates: segment.from.coordinates },
        path: segment.path,
        mean: line.name,
        distance: segment.distance,
      })
    })
  })

  // Add walking routes
  const walkingRoutes = await Route.find().lean()
  walkingRoutes.forEach(station => {
    const stationId = station.station_id.toString()
    graph.addNode(stationId)

    station.route.forEach(route => {
      const routeStationId = route.station_id.toString()
      graph.addNode(routeStationId)
      graph.addEdge(stationId, routeStationId, route.duration, {
        from: { line: 'walk', name: station.name, coordinates: station.coordinates },
        to: { line: 'walk', name: route.name, coordinates: route.coordinates },
        path: route.path,
        mean: 'walk',
        distance: route.distance,
      })
    })
  })

  return graph
}

async function findShortestPath(fromId, toId) {
  try {
    const graph = await createMatrix()
    const result = util.dijkstra(graph, fromId, toId)

    const formattedResult = {
      from: fromId,
      to: toId,
      cost: result.cost,
      path: result.path.map(edge => ({
        from: edge.from,
        to: edge.to,
        weight: edge.weight,
        label: {
          from: edge.label.from,
          to: edge.label.to,
          path: edge.label.path,
          mean: edge.label.mean,
          distance: edge.label.distance,
        },
      })),
    }

    return formattedResult
  } catch (error) {
    console.error('Error finding shortest path:', error)
  }
}
