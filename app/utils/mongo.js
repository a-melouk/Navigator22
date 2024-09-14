const { Station, Line } = require('../Models/line')

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
  return request
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

module.exports = { stationAlreadyExistsLine, stationExists, From_or_ToExists, findLengthOfLine, segmentWithSameOrder, orderOfSegment, updateOrder, updateTransportDurations }
