const mongoose = require('mongoose')
const Schema = mongoose.Schema

const coordinates = {
  latitude: 0.0,
  longitude: 0.0,
  _id: false,
}

const station = {
  name: '',
  coordinates: coordinates,
  id: String,
}

const segment = {
  from: station,
  to: station,
  path: [coordinates],
  order: Number,
  length: Number,
  duration: Number,
  distance: Number,
}

const stationSchema = {
  name: {
    type: String,
    required: true,
  },
  coordinates: {
    type: coordinates,
    required: true,
  },
  line: {
    type: String,
    required: true,
  },
}

const lineSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  route: [segment],
})

const segmentMatrix = {
  from: station,
  to: station,
  transport: {
    order: Number,
    duration: Number,
    distance: Number,
    path: [coordinates],
  },
  walk: {
    duration: Number,
    distance: Number,
    path: [coordinates],
  },
}

const lineMatrixSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    route: [segmentMatrix],
  },
  { timestamps: true }
)

const Line = mongoose.model('Line', lineSchema)
const Station = mongoose.model('Station', stationSchema)
const LineMatrix = mongoose.model('Matrix', lineMatrixSchema)
module.exports = { Line, Station, LineMatrix }
