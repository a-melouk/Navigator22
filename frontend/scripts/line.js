//------------------------------------Populating the SELECTs------------------------------------//
//Fetching all available lines
let populate = () => {
  getAllLinesNamesIdsDb().then(data => {
    populateList(data, 'line')
  })
}

//Fill with all FROMs and TOs of a line
function getStationsByLine(line) {
  getStationsFrom_LinesDb(line).then(data => {
    populateList(data.from, 'from')
    populateList(data.to, 'to')
  })
}

//Fill with all stations of a line
function populateListsToAddNewSegment(line) {
  getStationsFrom_StationsDb(line).then(data => {
    populateList(data, 'from')
    populateList(data, 'to')
  })
}
//----------------------------------------------------------------------------------------------//

//--------------------------------------Adding data to map--------------------------------------//
function addLineToMap(number) {
  clearMap(true)
  getLineByNameDb(number).then(data => {
    data.stations.forEach(item => addStationToMap(item, 'line', number))
    data.route.forEach(item => addPolylineToMap(item, 'black', 'line'))
    linelayer.addTo(map)
    map.fitBounds(linelayer.getBounds())
  })
  console.log('http://localhost:4000/lines/' + encodeURIComponent(number.trim()) + '/stations')
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
//----------------------------------------------------------------------------------------------//

//---------------------------------------Proccing events----------------------------------------//

map.on('draw:edited', function () {
  map.removeControl(drawControl)
  let choosenLine = lineElement.value

  if (segmentLayer.getLayers().length > 0) {
    let tempLayers = segmentLayer.getLayers()

    let modifiedFrom = false
    let modifiedTo = false
    let modifiedPath = false

    //New segment's from
    let from = {
      name: tempLayers[0].options.item.name,
      coordinates: {
        latitude: tempLayers[0]._latlng.lat,
        longitude: tempLayers[0]._latlng.lng
      },
      id: tempLayers[0].options.item.id
    }

    //New segment's to
    let to = {
      name: tempLayers[1].options.item.name,
      coordinates: {
        latitude: tempLayers[1]._latlng.lat,
        longitude: tempLayers[1]._latlng.lng
      },
      id: tempLayers[1].options.item.id
    }

    //New segment's path
    let path = []
    let tempPath = tempLayers[2]._latlngs
    tempPath.forEach(item => {
      let coordinates = {
        latitude: item.lat,
        longitude: item.lng
      }
      path.push(coordinates)
    })

    //Patch if stations coordinates were updated
    if (trueIfDifferent(from.coordinates, originalSegment.from.coordinates)) modifiedFrom = true
    if (trueIfDifferent(to.coordinates, originalSegment.to.coordinates)) modifiedTo = true
    if (modifiedFrom || modifiedTo) modifiedPath = true

    if (!modifiedPath)
      if (path.length !== originalSegment.path.length) modifiedPath = true
      else
        for (let i = 0; i < path.length; i++)
          if (trueIfDifferent(path[i], originalSegment.path[i])) {
            modifiedPath = true
            break
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
      if (map.distance([path[i].latitude, path[i].longitude], [path[i + 1].latitude, path[i + 1].longitude]) < 4.5) {
        path.splice(i + 1, 1)
        modifiedPath = true
      }

    if (map.distance([path[path.length - 2].latitude, path[path.length - 2].longitude], [path[path.length - 1].latitude, path[path.length - 1].longitude]) < 4.5) {
      path.splice(path.length - 2, 1)
      modifiedPath = true
    }
    console.log(modifiedFrom, modifiedTo, modifiedPath)

    let temp = {
      from: from,
      to: to,
      path: path,
      line: originalSegment.line,
      order: originalSegment.order
    }
    //TODO: Update related segments correctly
    if (modifiedPath) {
      patchSegmentDb(segmentLayer.options.id, temp)
        .then(() => {
          clearMap(true)
          addSegmentToMap(temp, 'red', 'segment')
          console.log('Segment : ' + from.name + ' to ' + to.name + ' patched')
        })
        .then(() => {
          if (modifiedFrom) {
            patchStationDb(from.id, from)
          }
          if (modifiedTo) {
            patchStationDb(to.id, to)
          }
        })
        .then(() => {
          const promiseFrom = new Promise((resolve, reject) => {
            if (modifiedFrom) {
              getRelatedSegmentDb('from', from.id).then(data => {
                if (typeof data !== 'undefined') {
                  let tempPath = data.path
                  tempPath.pop()
                  tempPath.push(from.coordinates)
                  removeClosePointsFront(tempPath)
                  let temp = {
                    from: data.from,
                    to: from,
                    path: tempPath,
                    order: originalSegment.order - 1
                  }
                  patchSegmentDb(data._id, temp).then(() => {
                    resolve('from')
                    console.log('Segment that ends with ' + from.name + ' patched')
                  })
                }
              })
            } else resolve('from')
          })

          const promiseTo = new Promise((resolve, reject) => {
            if (modifiedTo) {
              getRelatedSegmentDb('to', to.id).then(data => {
                if (typeof data !== 'undefined') {
                  let tempPath = data.path
                  tempPath.shift()
                  tempPath.unshift(to.coordinates)
                  removeClosePointsFront(tempPath)
                  let temp = {
                    from: to,
                    to: data.to,
                    path: tempPath,
                    order: originalSegment.order + 1
                  }
                  patchSegmentDb(data._id, temp).then(() => {
                    resolve('to')
                    console.log('Segment that starts with ' + to.name + ' patched')
                  })
                }
              })
            } else resolve('to')
          })
          Promise.all([promiseFrom, promiseTo]).then(() => {
            getStationsByLine(JSON.parse(choosenLine).name)
            clearMap(true)
          })
        })
    }
  }
})

function addSegmentToLine() {
  if (lineElement.value !== '') {
    getsegment.disabled = true
    addline.disabled = true
    clearMap(true)
    addDrawControlToMap('only-draw')
    populateListsToAddNewSegment(JSON.parse(lineElement.value).name)
    map.on('draw:created', function (e) {
      let layer = e.layer
      if (layer instanceof L.Marker)
        newStation(layer, JSON.parse(lineElement.value).name).then(response => {
          if (response.status === 409) displayNotification('Adding new station', 'Station already exists')
          else {
            clearMap(false)
            populateListsToAddNewSegment(JSON.parse(lineElement.value).name)
          }
        })
      else if (layer instanceof L.Polyline)
        newSegment(layer, 'Patch line segment').then(response => {
          if (response.status === 409) displayNotification('Patch segment of a line', 'Segment already exists')
          else {
            fromElement.options.length = 1
            toElement.options.length = 1
            populate()
          }
        })
    })
  } else {
    manipulationsElement.value = ''
    alert('Please select a line first')
  }
}

function cleanPath(line) {
  getLineByNameDb(line).then(data => {
    data.forEach(item => {
      let toUpdate = false
      let id = item._id
      let from = item.from
      let to = item.to
      if (removeClosePointsFront(item.path).length < item.path) {
        toUpdate = true
        item.path = [...removeClosePointsFront]
      }
      if (toUpdate) {
        const finalResult = {
          from: from,
          to: to,
          path: item.path,
          _id: id
        }
        patchSegmentDb(id, finalResult).then(() => console.log('Removed tight points'))
      }
    })
  })
}
//----------------------------------------------- -----------------------------------------------//
