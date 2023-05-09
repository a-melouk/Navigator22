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

function deleteLine() {
  if (lineElement.value !== '') {
    if (confirm('Confirm deleting the line ?') === true) return deleteLineDb()
  } else alert('Please select a line')
}

function newStation(layer, line) {
  return new Promise((resolve, reject) => {
    let station = {}
    document.getElementById('name').focus()
    document.getElementById('name').value = ''
    document.getElementById('latitude').value = layer.getLatLng().lat
    document.getElementById('longitude').value = layer.getLatLng().lng
    document.getElementById('existant-line').value = line

    function clickConfirm() {
      station = {
        name: toTitleCase(document.getElementById('name').value),
        coordinates: {
          latitude: document.getElementById('latitude').value,
          longitude: document.getElementById('longitude').value,
        },
        line: line,
      }
      postStationDb(station).then(data => resolve(data))

      document.getElementById('add-station').removeEventListener('click', clickConfirm, true)
      document.getElementById('cancelStation').removeEventListener('click', clickCancel, true)
      document.getElementById('closeStation').removeEventListener('click', clickCancel, true)
    }

    function clickCancel() {
      if (newStationPrompt.style.opacity === '1') {
        newStationPrompt.style.opacity = 0
        newStationPrompt.style.zIndex = 0
        newStationPrompt.classList.remove('tilt-in-top-1')
        reject('Canceled')
      }
      document.getElementById('add-station').removeEventListener('click', clickConfirm, true)
      document.getElementById('cancelStation').removeEventListener('click', clickCancel, true)
      document.getElementById('closeStation').removeEventListener('click', clickCancel, true)
    }

    document.getElementById('add-station').addEventListener('click', clickConfirm, true)
    document.getElementById('cancelStation').addEventListener('click', clickCancel, true)
    document.getElementById('closeStation').addEventListener('click', clickCancel, true)
  })
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
  newLinePrompt.classList.add('tilt-in-top-1')

  function clickCancel() {
    if (newLinePrompt.style.opacity === '1') {
      newLinePrompt.style.opacity = 0
      newLinePrompt.style.zIndex = 0
      manipulationsElement.value = ''
      newLinePrompt.classList.remove('tilt-in-top-1')
    }
    document.getElementById('cancel-line').removeEventListener('click', clickCancel, true)
    document.getElementById('closeLine').removeEventListener('click', clickCancel, true)
    document.getElementById('confirm-line').removeEventListener('click', clickConfirm, true)
  }

  function clickConfirm() {
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
        console.log('salam1')
        newStationPrompt.style.opacity = 1
        newStationPrompt.style.zIndex = 5000
        newStationPrompt.classList.add('tilt-in-top-1')
        newStation(layer, nameOfTheLine)
          .then(() => {
            console.log('salam2')
            populateListsToAddNewSegment(nameOfTheLine)
            newStationPrompt.style.opacity = 0
            newStationPrompt.style.zIndex = 0
            newStationPrompt.classList.remove('tilt-in-top-1')
            map.removeLayer(layer)
          })
          .catch(err => {
            console.log('salam3')
            console.log(err)
            map.removeLayer(layer)
          })
      }
      //
      else if (layer instanceof L.Polyline) newSegment(layer, 'New line segment')
    })
    document.getElementById('cancel-line').removeEventListener('click', clickCancel, true)
    document.getElementById('closeLine').removeEventListener('click', clickCancel, true)
    document.getElementById('confirm-line').removeEventListener('click', clickConfirm, true)
  }
  document.getElementById('cancel-line').addEventListener('click', clickCancel, true)
  document.getElementById('closeLine').addEventListener('click', clickCancel, true)
  document.getElementById('confirm-line').addEventListener('click', clickConfirm, true)
}
