function deleteStation(id) {
  return deleteStationByIdDb(id)
}

function deleteSegmentById(lineID, segmentID) {
  return deleteSegmentIdDb(lineID, segmentID)
}

function deleteStationFromSegment(id) {
  return deleteSegmentByStationIdDb(id)
}

function newStation(layer, line) {
  let station = {
    name: toTitleCase(prompt('Name of the station', '')),
    coordinates: {
      latitude: layer.getLatLng().lat,
      longitude: layer.getLatLng().lng,
    },
    line: line,
  }
  return postStationDb(station)
}

function newMiddleStation(coordinates, line) {
  let station = {
    name: toTitleCase(prompt('Name of the station', '')),
    coordinates: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
    line: line,
  }
  return postStationDb(station)
}

function newSegment(layer, choice) {
  let polyline = layer.getLatLngs()
  let path = []
  let point = {}
  polyline.forEach(item => {
    point = {
      latitude: item.lat,
      longitude: item.lng,
    }
    path.push(point)
  })

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
    id: fromValue._id,
  }

  let to = {
    name: toValue.name,
    coordinates: toValue.coordinates,
    id: toValue._id,
  }

  let segment = {
    from: from,
    to: to,
    path: path,
  }

  if (choice === 'Patch line segment')
    return patchLineDb(JSON.parse(document.getElementById('line').value)._id, segment)
  else if (choice === 'New line segment') routeLine.push(segment)
}

function newLine() {
  addline.disabled = false
  getsegment.disabled = true
  nameOfTheLine = prompt('Name of the line', 'metro')
  clearMap(true)
  addDrawControlToMap('only-draw')
  map.on('draw:created', function (e) {
    let layer = e.layer
    layer.addTo(map)
    if (layer instanceof L.Marker) {
      newStation(layer, nameOfTheLine).then(() => {
        populateListsToAddNewSegment(nameOfTheLine)
      })
    } else if (layer instanceof L.Polyline) newSegment(layer, 'New line segment')
  })
}
