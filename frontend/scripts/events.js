//Select options
let lineElement, fromElement, toElement

lineElement = document.getElementById('line')
fromElement = document.getElementById('from')
toElement = document.getElementById('to')

lineElement.addEventListener('change', (event) => {
  let line = event.target.value
  getStationsByLine(JSON.parse(line).name)
})

fromElement.addEventListener('change', (event) => {
  let from = event.target.value
  console.log(from)
  getSegmentByStationId('to', JSON.parse(from).id).then((data) => {
    // if (data !== undefined) toElement.value = JSON.stringify(data.to)
    toElement.value = JSON.stringify(data.to)
  })

  /* addStationToMap(JSON.parse(from), 'markers')
  markersLayer.addTo(map) */
})
toElement.addEventListener('change', (event) => {
  let to = event.target.value
  getSegmentByStationId('from', JSON.parse(to).id).then((data) => {
    // if (data !== undefined) fromElement.value = JSON.stringify(data.from)
    fromElement.value = JSON.stringify(data.from)
  })
  /* addStationToMap(JSON.parse(to), 'markers')
  markersLayer.addTo(map) */
})

let getsegment = document.getElementById('getsegment')
getsegment.addEventListener('click', () => {
  fetch(baseURI + 'lines/' + JSON.parse(lineElement.value).name + '?from=' + JSON.parse(fromElement.value).name + '&to=' + JSON.parse(toElement.value).name)
    .then((data) => data.json())
    .catch((err) => console.log(err))
    .then((data) => {
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

/* let buttonMarker = document.getElementById('buttonMarker')
buttonMarker.addEventListener('click', () => {
  console.log('salam')
})
 */
