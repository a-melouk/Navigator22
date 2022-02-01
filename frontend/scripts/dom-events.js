let lineElement = document.getElementById('line')
let fromElement = document.getElementById('from')
let toElement = document.getElementById('to')
let manipulationsElement = document.getElementById('manipulations')
let getsegment = document.getElementById('getsegment')
let addline = document.getElementById('addline')
let routeLine = []
let finish = false
let nameOfTheLine = ''

manipulationsElement.addEventListener('change', (event) => {
  let manipulation = event.target.value

  if (manipulation.toLowerCase() === 'edit-segment') {
    if (lineElement.value !== '') {
      addline.disabled = true
      getsegment.disabled = false
      clearMap()
      getStationsByLine(JSON.parse(lineElement.value).name)
      drawControl = new L.Control.Draw({
        position: 'topright',
        draw: false,
        edit: {
          featureGroup: segmentLayer,
        },
      })
      drawControl.addTo(map)
    } else {
      manipulationsElement.value = ''
      alert('Please select a line first')
    }
  } else if (manipulation.toLowerCase() === 'add-segment') {
    if (lineElement.value !== '') {
      getsegment.disabled = true
      addline.disabled = true
      populateListsToAddNewSegment(JSON.parse(lineElement.value).name)
      clearMap()
      drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          polygon: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
        },
        edit: false,
      })
      drawControl.addTo(map)
      map.on('draw:created', function (e) {
        let layer = e.layer
        layer.addTo(map)
        if (layer instanceof L.Marker) {
          newStation(layer, JSON.parse(lineElement.value).name)
        } else if (layer instanceof L.Polyline) newSegment(layer, 'Patch line segment')
        map.removeEventListener('draw:created')
      })
    } else {
      manipulationsElement.value = ''
      alert('Please select a line first')
    }
  } else if (manipulation.toLowerCase() === 'add-line') {
    addline.disabled = false
    getsegment.disabled = true
    nameOfTheLine = prompt('Name of the line', 'metro')
    clearMap()
    drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
      },
      edit: false,
    })
    drawControl.addTo(map)
    map.on('draw:created', function (e) {
      let layer = e.layer
      layer.addTo(map)
      if (layer instanceof L.Marker) {
        newStation(layer, nameOfTheLine).then(() => {
          console.log('salaaaam')
          populateListsToAddNewSegment(nameOfTheLine)
        })
      } else if (layer instanceof L.Polyline) newSegment(layer, 'New line segment')
      if (finish) map.removeEventListener('draw:created')
    })
  }
})

lineElement.addEventListener('change', (event) => {
  manipulationsElement.value = ''
  fromElement.options.length = 1
  toElement.options.length = 1
})

//Automatically fill TO select after picking FROM station
fromElement.addEventListener('change', (event) => {
  let from = event.target.value
  if (manipulationsElement.value === 'edit-segment')
    getRelatedSegment('to', JSON.parse(from).id).then((data) => {
      toElement.value = JSON.stringify(data.to)
    })
})

//Automatically fill FROM select after picking TO station
toElement.addEventListener('change', (event) => {
  let to = event.target.value
  if (manipulationsElement.value === 'edit-segment')
    getRelatedSegment('from', JSON.parse(to).id).then((data) => {
      fromElement.value = JSON.stringify(data.from)
    })
})

//Button for getting a segment
getsegment.addEventListener('click', () => {
  getSegmentHavingFromTo(
    JSON.parse(lineElement.value).name,
    JSON.parse(fromElement.value).id,
    JSON.parse(toElement.value).id
  ).then((data) => {
    if (data.from != undefined) {
      clearMap()
      addSegment(data, 'blue', 'segment')
      segmentLayer.options = {
        id: data.id,
      }
      segmentLayer.addTo(map)
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

  postLine(line).then(() => {
    console.log('Line added with success')
    routeLine = []
  })

  finish = true
})

/* let buttonMarker = document.getElementById('buttonMarker')
buttonMarker.addEventListener('click', () => {
  console.log('salam')
})
 */
