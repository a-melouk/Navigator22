let lineElement = document.getElementById('line')
let fromElement = document.getElementById('from')
let toElement = document.getElementById('to')
let manipulationsElement = document.getElementById('manipulations')
let getsegment = document.getElementById('getsegment')
let addline = document.getElementById('addline')
let newLineName = document.getElementById('new-line')
const newLinePrompt = document.getElementsByClassName('new-line')[0]
const newStationPrompt = document.getElementsByClassName('prompt-new-station')[0]
addline.disabled = true
getsegment.disabled = true
let routeLine = []
let nameOfTheLine = ''

let getroute = document.getElementById('getroute')

manipulationsElement.addEventListener('change', event => {
  let manipulation = event.target.value
  map.removeEventListener('draw:created') //for creation of new segments of a new line or just adding new segment to a line(add-segment VS add-line)
  if (manipulation.toLowerCase() === 'edit-segment') {
    if (lineElement.value !== '') {
      addline.disabled = true
      getsegment.disabled = false
      getStationsByLine(JSON.parse(lineElement.value).name)
    } else {
      manipulationsElement.value = ''
      alert('Please select a line first')
    }
  } else if (manipulation.toLowerCase() === 'add-segment') addSegmentToLine()
  else if (manipulation.toLowerCase() === 'add-line') newLine()
  else if (manipulation === 'getroute') populateWithAllStations()
})

lineElement.addEventListener('change', () => {
  manipulationsElement.value = ''
  fromElement.options.length = 1
  toElement.options.length = 1
  clearMap(true)
})

fromElement.addEventListener('change', event => {
  let from = event.target.value
  if (manipulationsElement.value === 'edit-segment') getRelatedSegmentDb('to', JSON.parse(from).id).then(data => (toElement.value = JSON.stringify(data.to)))
  else if (manipulationsElement.value === 'add-segment') {
    addStationToMap(JSON.parse(from), 'markers', JSON.parse(lineElement.value).name)
    markersLayer.addTo(map)
  } else if (manipulationsElement.value === 'add-line') {
    addStationToMap(JSON.parse(from), 'markers', nameOfTheLine)
    markersLayer.addTo(map)
  } else if (manipulationsElement.value === 'getroute') {
    //
  }
})

//Automatically fill FROM select after picking TO station
toElement.addEventListener('change', event => {
  let to = event.target.value
  if (manipulationsElement.value === 'edit-segment') getRelatedSegmentDb('from', JSON.parse(to).id).then(data => (fromElement.value = JSON.stringify(data.from)))
  else if (manipulationsElement.value === 'add-segment') {
    addStationToMap(JSON.parse(to), 'markers', JSON.parse(lineElement.value).name)
    markersLayer.addTo(map)
  } else if (manipulationsElement.value === 'add-line') {
    addStationToMap(JSON.parse(to), 'markers', nameOfTheLine)
    markersLayer.addTo(map)
  }
})

//Button for getting a segment
getsegment.addEventListener('click', () => {
  map.removeEventListener('draw:created')
  clearMap(true)

  addDrawControlToMap('both')
  getSegmentHavingFromToDb(JSON.parse(lineElement.value).name, JSON.parse(fromElement.value).id, JSON.parse(toElement.value).id).then(data => {
    if (typeof data.from !== 'undefined') {
      addSegmentToMap(data, 'blue', 'segment')
      segmentLayer.options = {
        id: data.id,
      }
      segmentLayer.addTo(map)

      //Adding middle station
      map.on('draw:created', function (e) {
        let tempLayers = segmentLayer.getLayers()
        let choosenLine = lineElement.value
        let path = []
        tempLayers[2]._latlngs.forEach(item => {
          let point = {
            latitude: item.lat,
            longitude: item.lng,
          }
          path.push(point)
        })

        newStationPrompt.style.opacity = 1
        newStationPrompt.style.zIndex = 5000
        let middle = middlePolyline(e.layer, path)
        newStation(e.layer, JSON.parse(choosenLine).name)
          .then(donnee => {
            if (donnee.status !== 409) {
              newStationPrompt.style.opacity = 0
              newStationPrompt.style.zIndex = 0
              let from = data.from
              let to = data.to
              let middleStation = {
                name: donnee.name,
                coordinates: donnee.coordinates,
                id: donnee._id,
              }
              let firstSegment = {
                from: from,
                to: middleStation,
                path: middle.firstHalf,
                order: data.order,
              }

              let secondSegment = {
                from: middleStation,
                to: to,
                path: middle.secondHalf,
                order: data.order + 1,
              }
              deleteSegmentById(JSON.parse(choosenLine)._id, data.id).then(() => {
                patchLineDb(JSON.parse(choosenLine)._id, firstSegment)
                  .then(response => {
                    if (response.status === 409) displayNotification('Patch segment of a line', 'Segment already exists')
                  })
                  .then(() => {
                    patchLineDb(JSON.parse(choosenLine)._id, secondSegment).then(response => {
                      if (response.status === 409) displayNotification('Patch segment of a line', 'Segment already exists')
                      else getStationsByLine(JSON.parse(choosenLine).name)
                    })
                  })
              })
            } else {
              displayNotification('Adding new station', 'Station already exists')
              newStationPrompt.style.opacity = 0
              newStationPrompt.style.zIndex = 0
            }
          })
          .catch(err => console.log(err))
      })
    } else {
      console.warn('Inexistant segment')
      alert('Inexistant segment')
    }
  })
})

getroute.addEventListener('click', () => {
  clearMap(true)
  const from = JSON.parse(fromElement.value)._id
  const to = JSON.parse(toElement.value)._id
  getRoute(from, to).then(route => {
    route.path.forEach(segment => {
      addStationToMap(segment.from, 'draw', segment.from.line)
      addStationToMap(segment.to, 'draw', segment.to.line)
      if (segment.mean === 'tramway') addPolylineToMap(segment.segment, '#f47e1b', 'draw')
      else if (segment.mean === 'walk') addPolylineToMap(segment.segment, '#1d691f', 'draw')
      else addPolylineToMap(segment.segment, '#3338d2', 'draw')
    })
    drawsLayer.addTo(map)
    map.fitBounds(drawsLayer.getBounds())
    // let distance = route.distance
    // let duration = route.duration
    // let hours = Math.floor(duration / 3600)
    // let minutes = Math.floor((duration - Math.floor(duration / 3600) * 3600) / 60)
    // let seconds = duration - Math.floor(duration / 3600) * 3600 - Math.floor((duration - Math.floor(duration / 3600) * 3600) / 60) * 60
    // console.log(route.from.coordinates.latitude, route.from.coordinates.longitude)
    // console.log(route.to.coordinates.latitude, route.to.coordinates.longitude)
    // if (Math.floor(distance / 1000) === 0) console.log(distance + 'm')
    // else console.log(distance / 1000 + 'km')
    // if (hours > 0) console.log(hours + ' hours, ' + minutes + ' minutes, ' + seconds + ' seconds')
    // else if (minutes > 0) console.log(minutes + ' minutes, ' + seconds + ' seconds')
    // else if (seconds > 0) console.log(seconds + ' seconds')
    // else console.log('Error')
  })
})

//Button for adding new line
addline.addEventListener('click', () => {
  let line = {
    name: nameOfTheLine,
    type: nameOfTheLine === 'tramway' ? 'tramway' : 'bus',
    route: routeLine,
  }

  postLineDb(line).then(() => {
    clearMap(true)
    fromElement.options.length = 1
    to.options.length = 1
    populate()
    routeLine = []
  })
})
