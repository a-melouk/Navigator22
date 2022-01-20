const baseURI = 'http://192.168.1.7:4000/'
let markers = L.featureGroup() //Contains markers of the transport line stations
let polylines = L.featureGroup() //Contains the polyline of a transport line
let line = L.featureGroup() //Contains markers and polyline
let segment = L.featureGroup() //Contains markers and polyline
let order = 1
let map = L.map('map', {
  center: [35.20118653849822, -0.6343081902114373],
  zoom: 15,
  maxZoom: 19,
})

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  subdomains: ['a', 'b', 'c'],
}).addTo(map)

let drawControl = new L.Control.Draw({
  position: 'topright',
  draw: {
    polygon: false,
    rectangle: false,
    circle: false,
    circlemarker: false,
  },
  edit: {
    featureGroup: line,
  },
})
drawControl.addTo(map)

let getLatLngs = (layer) => {
  if (layer instanceof L.Polyline) return layer.getLatLngs()
  if (layer instanceof L.Marker) return layer.getLatLng()
}

clearMap = () => {
  line.clearLayers()
}

function addStation(station) {
  let marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], { title: station.name })
    .bindPopup('<b>' + station.name + '</b>')
    .addTo(line)
}

function addPolyline(segment, color) {
  let pathArray = []
  for (let i = 0; i < segment.length; i++) pathArray.push([segment[i].latitude, segment[i].longitude])
  let poly = L.polyline(pathArray, { color: color }).addTo(line)
}

function addPolylineWithTitle(segment, title) {
  let pathArray = []
  for (let i = 0; i < segment.length; i++) pathArray.push([segment[i].latitude, segment[i].longitude])
  let poly = L.polyline(pathArray, { color: 'red', title: title }).addTo(line)
}

map.on('draw:created', function (e) {
  let layer = e.layer
  console.log(getLatLngs(layer))
  layer.addTo(map)
})

map.on('draw:edited', function (e) {
  let layers = e.layers

  layers.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) {
      console.log(layer._latlngs)
    } else if (layer instanceof L.Marker) {
      console.log(layer._latlng)
    }
  })
})
