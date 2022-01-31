let lineElement = document.getElementById('line')
let fromElement = document.getElementById('from')
let toElement = document.getElementById('to')

//Select a line
lineElement.addEventListener('change', (event) => {
  let line = event.target.value
  /* let choice = prompt('Add or Get', 'get')
  if (choice.toLowerCase() === 'get') getStationsByLine(JSON.parse(line).name)
  else if (choice.toLowerCase() === 'add') populateListsToAddNewSegment(JSON.parse(line).name) */
})

//Automatically fill TO select after picking FROM station
fromElement.addEventListener('change', (event) => {
  let from = event.target.value
  getRelatedSegment('to', JSON.parse(from).id).then((data) => {
    toElement.value = JSON.stringify(data.to)
  })
})

//Automatically fill FROM select after picking TO station
toElement.addEventListener('change', (event) => {
  let to = event.target.value
  getRelatedSegment('from', JSON.parse(to).id).then((data) => {
    fromElement.value = JSON.stringify(data.from)
  })
})

//Button for getting a segment
let getsegment = document.getElementById('getsegment')
getsegment.addEventListener('click', () => {
  getSegmentHavingFromTo(JSON.parse(lineElement.value).name, JSON.parse(fromElement.value).id, JSON.parse(toElement.value).id).then((data) => {
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
let addline = document.getElementById('addline')
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
