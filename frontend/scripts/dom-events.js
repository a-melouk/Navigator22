let lineElement = document.getElementById('line')
let fromElement = document.getElementById('from')
let toElement = document.getElementById('to')
let manipulationsElement = document.getElementById('manipulations')
let getsegment = document.getElementById('getsegment')
let addline = document.getElementById('addline')
addline.disabled = true
getsegment.disabled = true
let routeLine = []
let nameOfTheLine = ''

manipulationsElement.addEventListener('change', event => {
  let manipulation = event.target.value
  map.removeEventListener('draw:created') //for creation of new segments of a new line or just adding new segment to a line(add-segment VS add-line)
  if (manipulation.toLowerCase() === 'edit-segment') patchSegment()
  else if (manipulation.toLowerCase() === 'add-segment') addSegmentToLine()
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
  if (manipulationsElement.value === 'edit-segment')
    getRelatedSegmentDb('to', JSON.parse(from).id).then(data => {
      toElement.value = JSON.stringify(data.to)
    })
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
  if (manipulationsElement.value === 'edit-segment')
    getRelatedSegmentDb('from', JSON.parse(to).id).then(data => {
      fromElement.value = JSON.stringify(data.from)
    })
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
  getSegmentHavingFromToDb(
    JSON.parse(lineElement.value).name,
    JSON.parse(fromElement.value).id,
    JSON.parse(toElement.value).id
  ).then(data => {
    if (typeof data.from !== 'undefined') {
      addSegmentToMap(data, 'blue', 'segment')
      segmentLayer.options = {
        id: data.id,
      }
      segmentLayer.addTo(map)
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
        let middle = middlePolyline(e.layer, path)
        newStation(e.layer, JSON.parse(choosenLine).name).then(donnee => {
          console.log(donnee)
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
          }

          let secondSegment = {
            from: middleStation,
            to: to,
            path: middle.secondHalf,
          }
          console.log(firstSegment)
          console.log(secondSegment)
          deleteSegmentById(JSON.parse(choosenLine)._id, data.id).then(() => {
            patchLineDb(JSON.parse(choosenLine)._id, firstSegment)
              .then(response => {
                if (response.status === 409)
                  displayNotification('Patch segment of a line', 'Segment already exists')
              })
              .then(() => {
                patchLineDb(JSON.parse(choosenLine)._id, secondSegment).then(response => {
                  if (response.status === 409)
                    displayNotification('Patch segment of a line', 'Segment already exists')
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
    route: routeLine,
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

/*

getAllLinesNamesIdsDb().then(data => {
    populateList(data, 'line')
  })
*/

/* let rawData = {
  from: {
    coordinates: { latitude: 35.20902474807825, longitude: -0.6162750701035336 },
    name: 'Les Cascades',
    id: '61eb2de817e57cb86cb3f8f9',
  },
  to: {
    coordinates: { latitude: 35.21326746334253, longitude: -0.615711808204651 },
    name: 'Ghalmi Gare Routiere Est',
    id: '61eb2de817e57cb86cb3f8fa',
  },
  path: [
    { latitude: 35.20902474807825, longitude: -0.6162750701035336 },
    { latitude: 35.20939341424022, longitude: -0.6163941064212765 },
    { latitude: 35.20979151211425, longitude: -0.6165156382485183 },
    { latitude: 35.209996414580225, longitude: -0.6165513826533343 },
    { latitude: 35.2102958160374, longitude: -0.6165802622981499 },
    { latitude: 35.210992688241426, longitude: -0.6165647506713868 },
    { latitude: 35.211336126394364, longitude: -0.6165659596379137 },
    { latitude: 35.21171016752006, longitude: -0.6165516569776774 },
    { latitude: 35.21186796552786, longitude: -0.6165516569776774 },
    { latitude: 35.21215433881761, longitude: -0.6164872940245303 },
    { latitude: 35.212481621531516, longitude: -0.6163299621429875 },
    { latitude: 35.21259249882857, longitude: -0.6162475747845321 },
    { latitude: 35.21277367223473, longitude: -0.6161116975480896 },
    { latitude: 35.21319287137555, longitude: -0.6157702803415234 },
    { latitude: 35.21326746334253, longitude: -0.615711808204651 },
  ],
  id: '61f73c8708774aa5b12b373b',
  line: 'tramway',
}
let point = {
  latitude: 35.21147529599303,
  longitude: -0.616071544409317,
}
console.log(middlePolyline(point, rawData.path)) */
