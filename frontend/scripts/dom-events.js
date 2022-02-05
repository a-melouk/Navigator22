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
      console.log(data)
      segmentLayer.addTo(map)
      map.on('draw:created', function () {
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
        let middle = middlePolyline(path)
        console.log(middle)
        newMiddleStation(middle.middlepoint, JSON.parse(choosenLine).name).then(
          donnee => {
            middle.firstHalf.push(middle.middlepoint)
            middle.secondHalf.unshift(middle.middlepoint)
            let from = data.from
            let to = data.to
            let middleStation = {
              name: donnee.name,
              coordinates: {
                latitude: middle.middlepoint.latitude,
                longitude: middle.middlepoint.longitude,
              },
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
              patchLineDb(JSON.parse(choosenLine)._id, firstSegment).then(response => {
                if (response.status === 409)
                  displayNotification('Patch segment of a line', 'Segment already exists')
                else
                  patchLineDb(JSON.parse(choosenLine)._id, secondSegment).then(
                    response => {
                      if (response.status === 409)
                        displayNotification(
                          'Patch segment of a line',
                          'Segment already exists'
                        )
                    }
                  )
              })
            })
          }
        )
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
  console.log('New line to be added', line)

  postLineDb(line).then(() => {
    console.log('Line added with success')
    routeLine = []
    populate()
  })
})
