function deleteStation(id) {
  return deleteStationByIdDb(id)
}

function deleteSegmentById(lineID, segmentID) {
  return deleteSegmentIdDb(lineID, segmentID)
}

function deleteStationFromSegment(id) {
  return deleteSegmentByStationIdDb(id)
}

async function deletePart(stationID) {
  const promise = new Promise(async (resolve, reject) => {
    if (lineElement.value !== '') {
      await deleteStationByIdDb(stationID)
      await deleteStationFromSegment(stationID)
      resolve(true)
    } else reject(false)
  })
  promise
    .then(data => {
      if (data) {
        clearMap(true)
        getStationsByLine(JSON.parse(lineElement.value).name)
      }
    })
    .catch(() => alert('Please give name of the line'))
}

function newStation(layer, line) {
  return new Promise((resolve, reject) => {
    let station = {}
    document.getElementById('name').focus()
    document.getElementById('name').value = ''
    document.getElementById('latitude').value = layer.getLatLng().lat
    document.getElementById('longitude').value = layer.getLatLng().lng
    document.getElementById('existant-line').value = line
    document.getElementById('add-station').addEventListener(
      'click',
      () => {
        station = {
          name: toTitleCase(document.getElementById('name').value),
          coordinates: {
            latitude: document.getElementById('latitude').value,
            longitude: document.getElementById('longitude').value
          },
          line: line
        }
        postStationDb(station).then(data => resolve(data))
      },
      { once: true }
    )
  })
}

function newSegment(layer, choice) {
  let polyline = layer.getLatLngs()
  let path = []
  let point = {}
  polyline.forEach(item => {
    point = {
      latitude: item.lat,
      longitude: item.lng
    }
    path.push(point)
  })

  let fromValue = JSON.parse(document.getElementById('from').value)
  let toValue = JSON.parse(document.getElementById('to').value)

  //Put FROM station at the beginning of the path
  point = {
    latitude: fromValue.coordinates.latitude,
    longitude: fromValue.coordinates.longitude
  }
  path.unshift(point)

  //Put TO station at the end of the path
  point = {
    latitude: toValue.coordinates.latitude,
    longitude: toValue.coordinates.longitude
  }
  path.push(point)

  let from = {
    name: fromValue.name,
    coordinates: fromValue.coordinates,
    id: fromValue._id
  }

  let to = {
    name: toValue.name,
    coordinates: toValue.coordinates,
    id: toValue._id
  }

  let segment = {
    from: from,
    to: to,
    path: path
  }

  addStationToMap(segment.from, 'draw', nameOfTheLine)
  addStationToMap(segment.to, 'draw', nameOfTheLine)
  addPolylineToMap(segment.path, 'blue', 'draw')

  if (choice === 'Patch line segment') return patchLineDb(JSON.parse(document.getElementById('line').value)._id, segment)
  else if (choice === 'New line segment') routeLine.push(segment)
}

function newLine() {
  addline.disabled = false
  getsegment.disabled = true

  newLinePrompt.style.opacity = '1'
  newLinePrompt.style.zIndex = 5000
  newLinePrompt.classList.add('fadeIn')
  document.getElementById('confirm-line').addEventListener('click', () => {
    nameOfTheLine = newLineName.value
    newLinePrompt.style.opacity = '0'
    newLineName.value = ''
    newLinePrompt.style.zIndex = 0
    clearMap(true)
    addDrawControlToMap('only-draw')
    map.on('draw:created', function (e) {
      let layer = e.layer
      if (layer instanceof L.Marker) {
        layer.addTo(map)

        newStationPrompt.style.opacity = 1
        newStationPrompt.style.zIndex = 5000
        newStation(layer, nameOfTheLine).then(() => {
          populateListsToAddNewSegment(nameOfTheLine)
          newStationPrompt.style.opacity = 0
          newStationPrompt.style.zIndex = 0
        })
      }
      //
      else if (layer instanceof L.Polyline) newSegment(layer, 'New line segment')
    })
  })
}
