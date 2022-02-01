//Needed when you want to add a new line
function populateListsToAddNewSegment(line) {
  getStationsByLineForAdd(line).then((data) => {
    populateList(data, 'from')
    populateList(data, 'to')
  })
}

function newStation(layer, line) {
  let station = {
    coordinates: {
      latitude: layer.getLatLng().lat,
      longitude: layer.getLatLng().lng,
    },
    name: toTitleCase(prompt('Name of the station', '')),
    line: line,
  }

  return postStation(station)
}

function newSegment(layer, choice) {
  let polyline = layer.getLatLngs()
  let path = []
  let point = {}
  polyline.forEach((item) => {
    point = {
      latitude: item.lat,
      longitude: item.lng,
    }
    path.push(point)
  })

  // let lineValue = JSON.parse(document.getElementById('line').value)
  let fromValue = JSON.parse(document.getElementById('from').value)
  let toValue = JSON.parse(document.getElementById('to').value)

  //Put FROM station at the beginning of the path
  point = {
    latitude: fromValue.coordinates.latitude,
    longitude: fromValue.coordinates.longitude,
  }
  path.unshift(point)

  //Put TO station at the end of the path
  point = {
    latitude: toValue.coordinates.latitude,
    longitude: toValue.coordinates.longitude,
  }
  path.push(point)

  let from = {
    name: fromValue.name,
    coordinates: fromValue.coordinates,
    id: fromValue._id, //change to _id when adding a new line because we add segment by using stations data
  }

  let to = {
    name: toValue.name,
    coordinates: toValue.coordinates,
    id: toValue._id, //change to _id when adding a new line because we add segment by using stations data
  }

  let segment = {
    from: from,
    to: to,
    path: path,
  }
  console.log(segment.from.name, segment.to.name)

  if (choice === 'Patch line segment')
    patchLine(JSON.parse(document.getElementById('line').value)._id, segment)
  else if (choice === 'New line segment') routeLine.push(segment)
}

/* map.on('draw:created', function (e) {
  let layer = e.layer
  layer.addTo(map)
  if (layer instanceof L.Marker) newStation(layer)
  else if (layer instanceof L.Polyline) newSegment(layer)
}) */
