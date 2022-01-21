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
}

const segment = {
  from: station,
  to: station,
  path: [coordinates],
  order: Number,
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
  // order: {
  //   type: Number,
  // },
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

const polylineSchema = new Schema({
  name: {
    type: String,
    default: 'A16',
  },
  path: [coordinates],
})

const Line = mongoose.model('Line', lineSchema)
// const Polyline = mongoose.model('Polyline', polylineSchema)
const Station = mongoose.model('Station', stationSchema)
module.exports = { Line, Station }
