async function addLine(number) {
  let stations = []
  let segments = []

  //fetching the data
  const response = await fetch(baseURI + 'lines?name=' + number)
  let data = await response.json()
  data = data[0].route
  data.forEach((item) => {
    stations.push(item.from, item.to)
    segments.push(item.path)
  })
  //filter duplicate stations
  stations = stations.filter((v, i, a) => a.findIndex((t) => t.order === v.order) === i)

  //Adding overlays
  clearMap()
  stations.forEach((item) => addStation(item, 'line'))
  segments.forEach((item) => addPolyline(item, 'red', 'line'))
  line.addTo(map)
}

let populate = () => {
  fetch(baseURI + 'stations')
    .then((response) => response.json())
    .then((data) => {
      populateList(data, 'from')
      populateList(data, 'to')
    })
}

function populateList(data, id) {
  let list = document.getElementById(id)
  data.forEach((item) => {
    let option = new Option(item.name, JSON.stringify(item))
    list.appendChild(option)
  })
}

async function getSegment(from, to) {
  from = JSON.parse(from)
  to = JSON.parse(to)
  const response = await fetch(baseURI + 'lines/segment?from=' + from.name + '&to=' + to.name)
  let data = await response.json()
  addSegment(data)
}
