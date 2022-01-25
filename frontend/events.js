//Select options
let line, from, to
let lineElement, fromElement, toElement

lineElement = document.getElementById('line')
lineElement.addEventListener('change', (event) => {
  line = event.target.value
  getStationsByLine(event.target.value)
})

fromElement = document.getElementById('from')
fromElement.addEventListener('change', (event) => {
  from = event.target.value
  /* addStation(JSON.parse(from), 'markers')
  markersLayer.addTo(map) */
})
toElement = document.getElementById('to').addEventListener('change', (event) => {
  to = event.target.value
  /* addStation(JSON.parse(to), 'markers')
  markersLayer.addTo(map) */
})

let getsegment = document.getElementById('getsegment')
getsegment.addEventListener('click', (event) => {
  const response = fetch(baseURI + 'lines/' + line + '?from=' + JSON.parse(from).name + '&to=' + JSON.parse(to).name)
    .then((data) => data.json())
    .catch((err) => console.log(err))
    .then((data) => {
      clearMap()
      addSegment(data, 'blue', 'segment')
      segmentLayer.options = {
        id: data.id,
      }
      segmentLayer.addTo(map)
    })
})

/* let addline = document.getElementById('addline')
addline.addEventListener('click', (event) => {
  getSegment(from, to)
}) */
