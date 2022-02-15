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
        id: data.id
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
            longitude: item.lng
          }
          path.push(point)
        })

        newStationPrompt.style.opacity = 1
        newStationPrompt.style.zIndex = 5000
        let middle = middlePolyline(e.layer, path)
        newStation(e.layer, JSON.parse(choosenLine).name).then(donnee => {
          newStationPrompt.style.opacity = 0
          newStationPrompt.style.zIndex = 0
          let from = data.from
          let to = data.to
          let middleStation = {
            name: donnee.name,
            coordinates: donnee.coordinates,
            id: donnee._id
          }
          let firstSegment = {
            from: from,
            to: middleStation,
            path: middle.firstHalf,
            order: data.order
          }

          let secondSegment = {
            from: middleStation,
            to: to,
            path: middle.secondHalf,
            order: data.order + 1
          }
          deleteSegmentById(JSON.parse(choosenLine)._id, data.id).then(() => {
            patchLineDb(JSON.parse(choosenLine)._id, firstSegment)
              .then(response => {
                // console.log('Pushed first segment')
                if (response.status === 409) displayNotification('Patch segment of a line', 'Segment already exists')
              })
              .then(() => {
                patchLineDb(JSON.parse(choosenLine)._id, secondSegment).then(response => {
                  // console.log('Pushed second segment')
                  if (response.status === 409) displayNotification('Patch segment of a line', 'Segment already exists')
                  else getStationsByLine(JSON.parse(choosenLine).name)
                })
              })
          })
        })
      })
    } else {
      console.warn('Inexistant segment')
      alert('Inexistant segment')
    }
  })
})

//Button for adding new line
addline.addEventListener('click', () => {
  let line = {
    name: nameOfTheLine,
    type: nameOfTheLine === 'tramway' ? 'tramway' : 'bus',
    route: routeLine
  }

  postLineDb(line).then(() => {
    clearMap(true)
    fromElement.options.length = 1
    to.options.length = 1
    populate()
    routeLine = []
    populate()
  })
})

const right = document.getElementsByClassName('Lines')
getAllLinesNamesIdsDb().then(data => {
  populateList(data, 'line')
  data.forEach(item => {
    let line = document.createElement('button')
    line.innerText = item.name
    if (item.name === 'tramway') line.classList.add('lines', 'tramway')
    else line.classList.add('lines', 'bus')
    line.onclick = function () {
      addLineToMap.call(this, item.name)
      manipulationsElement.value = ''
      lineElement.value = JSON.stringify(item)
      fromElement.options.length = 1
      to.options.length = 1
    }
    right[0].appendChild(line)
  })
})
