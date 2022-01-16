const mongoose = require('mongoose')
const Schema = mongoose.Schema

const coords = new Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
})

const pointSchema = new Schema({
  coordinates: {
    type: Object,
  },
  order: {
    type: Number,
  },
})

const stationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  coordinates: {
    type: coords,
    required: true,
  },
})

const routeSchema = new Schema({
  from: {
    type: stationSchema,
    required: true,
  },
  to: {
    type: stationSchema,
    required: true,
  },
  path: {
    type: [pointSchema],
    required: true,
  },
})

const lineSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  route: routeSchema,
})

const Coords = mongoose.model('Coords', coords)
const Point = mongoose.model('Point', pointSchema)
const Station = mongoose.model('Station', stationSchema)
const Route = mongoose.model('Route', routeSchema)
const Line = mongoose.model('Line', lineSchema)
module.exports = Line
