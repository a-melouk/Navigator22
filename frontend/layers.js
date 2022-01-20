const baseURI = 'http://localhost:4000/'
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
    featureGroup: segment,
  },
})
drawControl.addTo(map)

let getLatLngs = (layer) => {
  if (layer instanceof L.Polyline) return layer.getLatLngs()
  if (layer instanceof L.Marker) return layer.getLatLng()
}

clearMap = () => {
  line.clearLayers()
  segment.clearLayers()
}

function addStation(station, layer) {
  let marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], { item: station }).bindPopup('<b>' + station.name + '</b>')
  if (layer === 'segment') marker.addTo(segment)
  else if (layer === 'line') marker.addTo(line)
}

/* function addPolyline(segment, color, layer) {
  let pathArray = []
  for (let i = 0; i < segment.length; i++) pathArray.push([segment[i].latitude, segment[i].longitude])
  let poly = L.polyline(pathArray, { color: color }).addTo(line)
} */

function addPolyline(seg, color, layer) {
  let pathArray = []
  for (let i = 0; i < seg.length; i++) pathArray.push([seg[i].latitude, seg[i].longitude])
  let poly = L.polyline(pathArray, { color: color, item: seg })
  if (layer === 'segment') poly.addTo(segment)
  else if (layer === 'line') poly.addTo(line)
}

function addSegment(seg) {
  clearMap()
  addStation(seg.from, 'segment')
  addStation(seg.to, 'segment')
  addPolyline(seg.path, 'black', 'segment')
  segment.addTo(map)
}

map.on('draw:created', function (e) {
  let layer = e.layer
  console.log(getLatLngs(layer))
  layer.addTo(map)
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
  let tempLayers = segment.getLayers()
  temp.from = tempLayers[0].options.item
  temp.to = tempLayers[1].options.item
  temp.path = tempLayers[2].options.item
  console.log(temp)
})
