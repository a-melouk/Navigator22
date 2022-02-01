let lineElement = document.getElementById('line')
let fromElement = document.getElementById('from')
let toElement = document.getElementById('to')
let manipulationsElement = document.getElementById('manipulations')
let getsegment = document.getElementById('getsegment')
let addline = document.getElementById('addline')

manipulationsElement.addEventListener('change', (event) => {
  if (event.target.value !== 'add-line')
    if (lineElement.value !== '') {
      let manipulation = event.target.value
      if (manipulation.toLowerCase() === 'edit-segment') {
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
        clearMap()
        getsegment.disabled = true
        addline.disabled = false
        populateListsToAddNewSegment(JSON.parse(lineElement.value).name)
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
      }
    } else {
      manipulationsElement.value = ''
      alert('Please select a line first')
    }
  else {
    // lineElement.options.length = 1
    fromElement.options.length = 1
    toElement.options.length = 1
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
    name: lineElement.value,
    type: lineElement.value === 'tramway' ? 'tramway' : 'bus',
    route: route,
  }
  console.log('New line to be added', line)
  let confirm = prompt('Confirm adding the line', 'No')
  if (confirm !== null && confirm.toLowerCase() === 'yes') {
    postLine(line).then(() => {
      console.log('Line added with success')
      route = []
      lastValue = 1
    })
  }
})

/* let buttonMarker = document.getElementById('buttonMarker')
buttonMarker.addEventListener('click', () => {
  console.log('salam')
})
 */
