const mongoose = require('mongoose')
const Schema = mongoose.Schema

const coordinates = {
  latitude: 0.0,
  longitude: 0.0,
  _id: false
}

const station = {
  name: '',
  coordinates: coordinates,
  id: String
}

const segment = {
  from: station,
  to: station,
  path: [coordinates],
  order: Number
}

const stationSchema = {
  name: {
    type: String,
    required: true
  },
  coordinates: {
    type: coordinates,
    required: true
  },
  line: {
    type: String,
    required: true
  }
}

const lineSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  route: [segment]
})

const Line = mongoose.model('Line', lineSchema)
const Test = mongoose.model('Test', lineSchema)
const Station = mongoose.model('Station', stationSchema)
module.exports = { Line, Station, Test }
