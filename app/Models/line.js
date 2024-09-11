const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const coordinatesSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
)

const stationSchema = new Schema({
  name: { type: String, required: true },
  coordinates: { type: coordinatesSchema, required: true },
  line: { type: String, required: true },
})

const segmentStation = new Schema(
  {
    name: { type: String, required: true },
    coordinates: { type: coordinatesSchema, required: true },
    id: { type: String, required: true },
  },
  { _id: false }
)

const segmentSchema = new Schema(
  {
    from: { type: segmentStation, required: true },
    to: { type: segmentStation, required: true },
    path: [{ type: coordinatesSchema, required: true }],
    order: { type: Number, required: true },
    distance: { type: Number, required: false },
    duration: { type: Number, required: false },
  },
  { _id: true }
)

const lineSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  route: [segmentSchema],
})

const transportSchema = new Schema({
  order: { type: Number, required: true },
  duration: { type: Number, required: false },
  distance: { type: Number, required: false },
  path: [{ type: coordinatesSchema, required: true }],
})

const walkSchema = new mongoose.Schema({
  duration: { type: Number, required: true },
  distance: { type: Number, required: true },
  path: [{ type: coordinatesSchema, required: true }],
})

const segmentMatrixSchema = new Schema({
  from: { type: stationSchema, required: true },
  to: { type: stationSchema, required: true },
  transport: { type: transportSchema, required: true },
  walk: { type: walkSchema, required: true },
})

const lineMatrixSchema = new Schema(
  {
    name: { type: String, required: true },
    route: [segmentMatrixSchema],
    line_id: ObjectId,
    type: String,
  },
  { timestamps: true }
)

const stationRoutesSchema = new Schema({
  name: { type: String, required: true },
  coordinates: { type: coordinatesSchema, required: true },
  line: { type: String, required: true },
  station_id: { type: ObjectId, required: true },
  distance: { type: Number, required: true },
  duration: { type: Number, required: true },
  path: { type: String, required: true },
})

const matrix = new Schema(
  {
    name: { type: String, required: true },
    coordinates: { type: coordinatesSchema, required: true },
    line: { type: String, required: true },
    station_id: { type: ObjectId, required: true },
    route: [{ type: stationRoutesSchema, required: true }],
  },
  { timestamps: true }
)

const Line = mongoose.model('Line', lineSchema)
const Station = mongoose.model('Station', stationSchema)
const LineMatrix = mongoose.model('Matrix', lineMatrixSchema)
const Route = mongoose.model('routes', matrix)
module.exports = { Line, Station, LineMatrix, Route }
