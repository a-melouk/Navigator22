//Fill with FROMs and TOs
function getStationsByLine(line) {
  getStationsFrom_LinesDb(line).then(data => {
    populateList(data.from, 'from')
    populateList(data.to, 'to')
  })
}

//Needed when you want to add a new line
function populateListsToAddNewSegment(line) {
  getStationsFrom_StationsDb(line).then(data => {
    populateList(data, 'from')
    populateList(data, 'to')
  })
}

function addLineToMap(number) {
  clearMap(true)
  getLineByNameDb(number).then(data => {
    data.forEach(item => {
      addStationToMap(item.from, 'line', number)
      addStationToMap(item.to, 'line', number)
      addPolylineToMap(item.path, 'black', 'line')
    })
    linelayer.addTo(map)
    map.fitBounds(linelayer.getBounds())
  })
}

let originalSegment = {}
function addSegmentToMap(segment, color, layer) {
  clearMap(true)
  addStationToMap(segment.from, layer, segment.line)
  addStationToMap(segment.to, layer, segment.line)
  addPolylineToMap(segment.path, color, layer)
  if (layer === 'segment') addDrawControlToMap('both')
  else if (layer === 'draw') addDrawControlToMap('only-draw')
  originalSegment = segment
}

function addSegmentToLine() {
  if (lineElement.value !== '') {
    getsegment.disabled = true
    addline.disabled = true
    clearMap(true)
    addDrawControlToMap('only-draw')
    populateListsToAddNewSegment(JSON.parse(lineElement.value).name)
    map.on('draw:created', function (e) {
      let layer = e.layer
      layer.addTo(drawsLayer)
      drawsLayer.addTo(map)
      if (layer instanceof L.Marker)
        newStation(layer, JSON.parse(lineElement.value).name).then(data => {
          if (data.status === 409)
            displayNotification('Adding new station', 'Station already exists')
          else populateListsToAddNewSegment(JSON.parse(lineElement.value).name)
        })
      else if (layer instanceof L.Polyline) newSegment(layer, 'Patch line segment')
    })
  } else {
    manipulationsElement.value = ''
    alert('Please select a line first')
  }
}

function editSegment() {
  if (lineElement.value !== '') {
    addline.disabled = true
    getsegment.disabled = false
    clearMap(true)
    getStationsByLine(JSON.parse(lineElement.value).name)
    addDrawControlToMap('both')

    map.on('draw:edited', function () {
      map.removeControl(drawControl)
      let choosenLine = lineElement.value

      if (segmentLayer.getLayers().length > 0) {
        let tempLayers = segmentLayer.getLayers()

        let modifiedFrom = false,
          modifiedTo = false,
          modifiedPath = false

        //New segment's from
        let from = {
          name: tempLayers[0].options.item.name,
          coordinates: {
            latitude: tempLayers[0]._latlng.lat,
            longitude: tempLayers[0]._latlng.lng,
          },
          id: tempLayers[0].options.item.id,
        }

        //New segment's to
        let to = {
          name: tempLayers[1].options.item.name,
          coordinates: {
            latitude: tempLayers[1]._latlng.lat,
            longitude: tempLayers[1]._latlng.lng,
          },
          id: tempLayers[1].options.item.id,
        }

        //New segment's path
        let path = []
        let tempPath = tempLayers[2]._latlngs
        tempPath.forEach(item => {
          let coordinates = {
            latitude: item.lat,
            longitude: item.lng,
          }
          path.push(coordinates)
        })

        //Patch if stations coordinates were updated
        if (trueIfDifferent(from.coordinates, originalSegment.from.coordinates)) {
          modifiedFrom = true
          modifiedPath = true
        }
        if (trueIfDifferent(to.coordinates, originalSegment.to.coordinates)) {
          modifiedTo = true
          modifiedPath = true
        }

        if (path.length === originalSegment.path.length) {
          for (let i = 0; i < path.length; i++) {
            if (trueIfDifferent(path[i], originalSegment.path[i])) {
              modifiedPath = true
              break
            }
          }
        } else modifiedPath = true

        if (modifiedFrom) {
          patchStationDb(from.id, from)
          getRelatedSegmentDb('from', from.id).then(data => {
            if (typeof data !== 'undefined') {
              let tempPath = data.path
              tempPath.pop()
              tempPath.push(from.coordinates)
              removeClosePoints(tempPath)
              let temp = {
                from: data.from,
                to: from,
                path: tempPath,
              }
              patchSegmentDb(data._id, temp).then(() =>
                console.log('Related segment patched successfully')
              )
            }
          })
        }

        if (modifiedTo) {
          patchStationDb(to.id, to)
          getRelatedSegmentDb('to', to.id).then(data => {
            if (typeof data !== 'undefined') {
              let tempPath = data.path
              tempPath.shift()
              tempPath.unshift(to.coordinates)
              removeClosePoints(tempPath)
              let temp = {
                from: to,
                to: data.to,
                path: tempPath,
              }
              patchSegmentDb(data._id, temp).then(() =>
                console.log('Related segment patched successfully')
              )
            }
          })
        }

        //The polyline always start with FROM coordinate and ends with TO coordinates
        if (trueIfDifferent(path[0], from.coordinates)) {
          path.unshift(from.coordinates)
          modifiedPath = true
        }
        if (trueIfDifferent(path[path.length - 1], to.coordinates)) {
          path.push(to.coordinates)
          modifiedPath = true
        }

        for (let i = 0; i < path.length - 2; i++)
          if (
            map.distance(
              [path[i].latitude, path[i].longitude],
              [path[i + 1].latitude, path[i + 1].longitude]
            ) < 4.5
          ) {
            path.splice(i + 1, 1)
            modifiedPath = true
          }

        if (
          map.distance(
            [path[path.length - 2].latitude, path[path.length - 2].longitude],
            [path[path.length - 1].latitude, path[path.length - 1].longitude]
          ) < 4.5
        ) {
          path.splice(path.length - 2, 1)
          modifiedPath = true
        }

        let temp = {
          from: from,
          to: to,
          path: path,
          line: originalSegment.line,
        }

        if (modifiedPath) {
          patchSegmentDb(segmentLayer.options.id, temp).then(() => {
            console.log('Segment patched successfully')
            clearMap(true)
            addSegmentToMap(temp, 'red', 'segment')
            getStationsByLine(JSON.parse(choosenLine).name)
          })
        }
      }
    })
  } else {
    manipulationsElement.value = ''
    alert('Please select a line first')
  }
}

function middlePolyline(path) {
  let distance = 0
  let result = {}
  let firstHalf = []
  let secondHalf = []
  for (let i = 0; i < path.length - 1; i++)
    distance += map.distance(
      [path[i].latitude, path[i].longitude],
      [path[i + 1].latitude, path[i + 1].longitude]
    )

  let initDistance = 0
  for (let i = 0; i < path.length - 1; i++) {
    if (initDistance > distance / 2) {
      result.middlepoint = path[i]
      path.splice(i, 1)
      break
    } else {
      initDistance += map.distance(
        [path[i].latitude, path[i].longitude],
        [path[i + 1].latitude, path[i + 1].longitude]
      )
      firstHalf.push(path[i])
    }
  }
  secondHalf = path.filter(x => !firstHalf.includes(x))
  result.firstHalf = firstHalf
  result.secondHalf = secondHalf
  return result
}

function deleteStation(id) {
  return deleteStationByIdDb(id)
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
    patchLineDb(JSON.parse(document.getElementById('line').value)._id, segment).then(
      response => {
        if (response.status === 409)
          displayNotification('Patch segment of a line', 'Segment already exists')
      }
    )
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
