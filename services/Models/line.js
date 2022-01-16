const mongoose = require('mongoose')
const Schema = mongoose.Schema

const coordinates = {
  latitude: 0.0,
  longitude: 0.0,
}

const point = {
  coordinates: coordinates,
  order: 0,
}

const station = {
  name: '',
  order: 0,
  coordinates: coordinates,
}

const segment = {
  from: station,
  to: station,
  path: [point],
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

const Line = mongoose.model('Line', lineSchema)
module.exports = Line
