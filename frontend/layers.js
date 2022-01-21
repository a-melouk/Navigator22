const baseURI = 'http://localhost:4000/'
let linelayer = L.featureGroup() //Contains markers and polyline
let segmentLayer = L.featureGroup() //Contains markers and polyline
let partLayer = L.featureGroup() //Contains markers and polyline
let markersLayer = L.featureGroup() //Contains markers and polyline

let map = L.map('map', {
  center: [35.20118653849822, -0.6343081902114373],
  zoom: 15,
  maxZoom: 18,
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
  else if (layer === 'part') marker.addTo(partLayer)
  else if (layer === 'markers') marker.addTo(markersLayer)
}

function addPolyline(seg, color, layer) {
  let pathArray = []
  for (let i = 0; i < seg.length; i++) pathArray.push([seg[i].latitude, seg[i].longitude])
  let poly = L.polyline(pathArray, { color: color, item: seg })
  if (layer === 'segment') poly.addTo(segmentLayer)
  else if (layer === 'line') poly.addTo(linelayer)
  else if (layer === 'part') poly.addTo(partLayer)
}

const toTitleCase = (string) => {
  return string
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

let lastValue = 1
let route = []

map.on('draw:created', function (e) {
  let layer = e.layer
  layer.addTo(map)
  let station = {}
  if (layer instanceof L.Marker) {
    station.coordinates = {
      latitude: layer.getLatLng().lat,
      longitude: layer.getLatLng().lng,
    }
    station.name = toTitleCase(prompt('Name of the station', ''))
    station.line = prompt('Line ?', 'tramway')

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
    station = {}
  } else if (layer instanceof L.Polyline) {
    let polyline = layer.getLatLngs()
    let path = []
    console.log(polyline)
    let point = {}
    polyline.forEach((item) => {
      point.latitude = item.lat
      point.longitude = item.lng
      path.push(point)
      point = {}
    })

    let order = Number(prompt('Order', String(lastValue)))
    let fromOptionValue = JSON.parse(document.getElementById('from').value)
    let toOptionValue = JSON.parse(document.getElementById('to').value)
    point.latitude = fromOptionValue.coordinates.latitude
    point.longitude = fromOptionValue.coordinates.longitude
    path.unshift(point)
    point = {}
    point.latitude = toOptionValue.coordinates.latitude
    point.longitude = toOptionValue.coordinates.longitude
    path.push(point)

    let segment = {}
    let from = {}
    let to = {}

    from = fromOptionValue
    to = toOptionValue

    segment.from = from
    segment.to = to
    segment.path = path
    segment.order = order
    console.log(segment)
    route.push(segment)
    lastValue++

    // const optionsPost = {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: segment,
    // }
    // const response = fetch('/lines', optionsPost)
    console.log(segment)

    point = {}
    segment = {}
    from = {}
    to = {}
    path = []
  }
})

let addline = document.getElementById('addline')
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
  line = {}
  route = []
})

map.on('draw:edited', function (e) {
  let layers = e.layers
  let temp = {}

  layers.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) {
      console.log(layer.options.item, layer._latlngs)
    } else if (layer instanceof L.Marker) {
      console.log(layer.options.title, layer._latlng)
    }
  })
  if (segmentLayer.getLayers().length > 0) {
    let tempLayers = segmentLayer.getLayers()
    temp.from = tempLayers[0].options.item
    temp.to = tempLayers[1].options.item
    temp.path = tempLayers[2].options.item
    console.log(temp)
  } else if (partLayer.getLayers().length > 0) {
    let tempLayers = partLayer.getLayers()
    console.log(tempLayers)
    let result = []
    for (let i = 0; i < tempLayers.length; i = i + 3) {
      temp.from = tempLayers[i].options.item
      temp.to = tempLayers[i + 1].options.item
      temp.path = tempLayers[i + 2].options.item
      result.push(temp)
      temp = {}
    }
    console.log(result)
  }
})
