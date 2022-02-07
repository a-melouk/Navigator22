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
function patchSegment() {
  if (lineElement.value !== '') {
    addline.disabled = true
    getsegment.disabled = false
    getStationsByLine(JSON.parse(lineElement.value).name)
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
          if (response.status === 409)
            displayNotification('Adding new station', 'Station already exists')
          else {
            clearMap(false)
            populateListsToAddNewSegment(JSON.parse(lineElement.value).name)
          }
        })
      else if (layer instanceof L.Polyline)
        newSegment(layer, 'Patch line segment').then(response => {
          if (response.status === 409)
            displayNotification('Patch segment of a line', 'Segment already exists')
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
//----------------------------------------------- -----------------------------------------------//
