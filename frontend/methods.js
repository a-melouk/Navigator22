let populate = () => {
  let allStations
  fetch(baseURI + 'stations')
    .then((response) => response.json())
    .then((data) => {
      allStations = data
    })
    .then(() => {
      let lines = []
      allStations.forEach((item) => {
        lines.push(item.line)
      })
      lines = [...new Set(lines)]
      populateList(lines, 'line')
    })
}

function getStationsByLine(line) {
  fetch(baseURI + 'stations/' + line)
    .then((response) => response.json())
    .then((data) => {
      populateList(data, 'from')
      populateList(data, 'to')
    })
}

function populateList(data, id) {
  let list = document.getElementById(id)

  if (id === 'line') {
    data.forEach((item) => {
      let option = new Option(item, item)
      list.appendChild(option)
    })
  } else {
    list.replaceChildren()
    data.forEach((item) => {
      let option = new Option(item.name, JSON.stringify(item))
      list.appendChild(option)
    })
  }
}

function addPart(part) {
  let from = part.from
  let to = part.to
  let path = part.path
  addStation(from, 'part')
  addStation(to, 'part')
  addPolyline(path, 'red', 'part')
  partLayer.addTo(map)
}

async function addLine(number) {
  let stations = []
  let segments = []
  clearMap()

  //fetching the data
  const response = await fetch(baseURI + 'lines?name=' + number)
  let data = await response.json()
  data = data[0].route
  data.forEach((item) => {
    let temp = {}
    temp.from = item.from
    temp.to = item.to
    temp.path = item.path
    addPart(temp)
    temp = {}
  })

  /*
      data.forEach((item) => {
        stations.push(item.from, item.to)
        segments.push(item.path)
      })
      //filter duplicate stations
      stations = stations.filter((v, i, a) => a.findIndex((t) => t.order === v.order) === i)
  */

  //Adding overlays

  // stations.forEach((item) => addStation(item, 'line'))
  // segments.forEach((item) => addPolyline(item, 'red', 'line'))
  linelayer.addTo(map)
  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polygon: false,
      rectangle: false,
      circle: false,
      circlemarker: false,
    },
    edit: {
      featureGroup: partLayer,
    },
  })
  drawControl.addTo(map)
  // console.log(line.toGeoJSON())
}

async function getSegment(from, to) {
  console.log('salam')
  from = JSON.parse(from)
  to = JSON.parse(to)
  const response = await fetch(baseURI + 'lines/segment?from=' + from.name + '&to=' + to.name)
  let data = await response.json()
  addSegment(data)
}

function addSegment(seg) {
  clearMap()
  addStation(seg.from, 'segment')
  addStation(seg.to, 'segment')
  addPolyline(seg.path, 'black', 'segment')
  segmentLayer.addTo(map)
  console.log(segmentLayer.toGeoJSON())
  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polygon: false,
      rectangle: false,
      circle: false,
      circlemarker: false,
    },
    edit: {
      featureGroup: segmentLayer,
    },
  })
  drawControl.addTo(map)
}
