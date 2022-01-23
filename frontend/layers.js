const baseURI = 'http://localhost:4000/'
let linelayer = L.featureGroup() //Contains markers and polyline
let segmentLayer = L.featureGroup() //Contains markers and polyline
let partLayer = L.featureGroup() //Contains markers and polyline
let markersLayer = L.featureGroup() //Contains markers and polyline

let map = L.map('map', {
  center: [35.20118653849822, -0.6343081902114373],
  zoom: 15,
  maxZoom: 18,
  minZoom: 13,
})

const tile = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  subdomains: ['a', 'b', 'c'],
})

let drawControl = new L.Control.Draw({
  position: 'topright',
  draw: {
    polygon: false,
    rectangle: false,
    circle: false,
    circlemarker: false,
  },
})

let getLatLngs = (layer) => {
  if (layer instanceof L.Polyline) {
    return layer.getLatLngs()
  }
  if (layer instanceof L.Marker) {
    return layer.getLatLng()
  }
}

function init() {
  tile.addTo(map)
  drawControl.addTo(map)
  console.log('Map initialized')
}

init()

clearMap = () => {
  map.eachLayer((layer) => {
    if (!layer instanceof L.TileLayer) map.removeLayer(layer)
    map.removeControl(drawControl)
  })
  linelayer.clearLayers()
  segmentLayer.clearLayers()
}

function addStation(station, layer) {
  let marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], { item: station }).bindPopup('<b>' + station.name + '</b>')
  if (layer === 'segment') marker.addTo(segmentLayer)
  else if (layer === 'line') marker.addTo(linelayer)
  // else if (layer === 'markers') marker.addTo(markersLayer)
}

function addPolyline(seg, color, layer) {
  let pathArray = []
  console.log('Original path', seg)
  for (let i = 0; i < seg.length; i++) pathArray.push([seg[i].latitude, seg[i].longitude])
  let poly = L.polyline(pathArray, { color: color, item: seg })
  if (layer === 'segment') poly.addTo(segmentLayer)
  else if (layer === 'line') poly.addTo(linelayer)
}

function addSegment(segment, color, layer) {
  clearMap()
  console.log('Segment from ' + segment.from.name + ' to ' + segment.to.name)
  addStation(segment.from, layer)
  addStation(segment.to, layer)
  addPolyline(segment.path, color, layer)
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

const toTitleCase = (string) => {
  return string
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function newStation(layer) {
  let station = {}
  station.coordinates = {
    latitude: layer.getLatLng().lat,
    longitude: layer.getLatLng().lng,
  }
  station.name = toTitleCase(prompt('Name of the station', ''))
  station.line = prompt('Line ?', 'tramway')
  let confirm = prompt('Confirm adding the station', 'No')
  if (confirm.toLowerCase() === 'yes') {
    const response = fetch(baseURI + 'stations', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(station),
    })
      .then((data) => data.json())
      .catch((err) => console.log(err))
  }
  station = {}
}

let route = []
function newSegment(layer) {
  let polyline = layer.getLatLngs()
  let path = []
  let point = {}
  polyline.forEach((item) => {
    point.latitude = item.lat
    point.longitude = item.lng
    path.push(point)
    point = {}
  })

  let lastValue = 1
  let order = Number(prompt('Order', String(lastValue)))
  let fromOptionValue = JSON.parse(document.getElementById('from').value)
  let toOptionValue = JSON.parse(document.getElementById('to').value)

  //Put from station at the beginning of the path
  point = {
    latitude: fromOptionValue.coordinates.latitude,
    longitude: fromOptionValue.coordinates.longitude,
  }
  path.unshift(point)

  //Put from station at the end of the path
  point = {
    latitude: toOptionValue.coordinates.latitude,
    longitude: toOptionValue.coordinates.longitude,
  }
  path.push(point)

  let from = {
    name: fromOptionValue.name,
    coordinates: fromOptionValue.coordinates,
    id: fromOptionValue._id,
  }

  let to = {
    name: toOptionValue.name,
    coordinates: toOptionValue.coordinates,
    id: toOptionValue._id,
  }

  let segment = {
    from: from,
    to: to,
    path: path,
    order: order,
  }

  route.push(segment)
  lastValue++

  console.log(segment)
  console.log(route)

  // point = {}
  // segment = {}
  // from = {}
  // to = {}
  // path = []
  // return route
}

map.on('draw:created', function (e) {
  let layer = e.layer
  layer.addTo(map)
  if (layer instanceof L.Marker) newStation(layer)
  else if (layer instanceof L.Polyline) newSegment(layer)
})

let addline = document.getElementById('addline')
// addline.disabled = true
addline.addEventListener('click', (event) => {
  let line = {}
  line.name = lineElement.value
  if (lineElement.value === 'tramway') {
    line.type = 'tramway'
  } else {
    line.type = 'bus'
  }
  line.route = route
  console.log(line)
  let confirm = prompt('Confirm adding the station', 'No')
  if (confirm.toLowerCase() === 'yes') {
    const response = fetch(baseURI + 'lines', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(line),
    })
      .then((data) => {
        data.json()
        line = {}
        route = []
      })
      .catch((err) => {
        console.log(err)
        line = {}
        route = []
      })
  }
})

map.on('draw:edited', function (e) {
  let layers = e.layers
  let temp = {}

  layers.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) {
      console.log('Path', layer._latlngs)
    } else if (layer instanceof L.Marker) {
      console.log(layer.options.title, layer._latlng)
    }
  })
  if (segmentLayer.getLayers().length > 0) {
    let tempLayers = segmentLayer.getLayers()
    console.log(tempLayers)
    let from = {
      name: tempLayers[0].options.item.name,
      id: tempLayers[0].options.item.id,
      coordinates: {
        latitude: tempLayers[0]._latlng.lat,
        longitude: tempLayers[0]._latlng.lng,
      },
    }
    let to = {
      name: tempLayers[1].options.item.name,
      id: tempLayers[1].options.item.id,
      coordinates: {
        latitude: tempLayers[1]._latlng.lat,
        longitude: tempLayers[1]._latlng.lng,
      },
    }
    let path = []

    let tempPath = tempLayers[2]._latlngs

    tempPath.forEach((item) => {
      let coordinates = {
        latitude: item.lat,
        longitude: item.lng,
      }
      path.push(coordinates)
    })

    temp.from = from
    temp.to = to
    temp.path = path
    console.log(temp)
    temp = {}
    from = {}
    to = {}
    path = []
  }
})
