let linelayer = L.featureGroup() //Contains markers and polyline of a line
let segmentLayer = L.featureGroup() //Contains markers and polyline of a segment
let markersLayer = L.featureGroup() //Contains markers of stations that are going to be added to a line
let drawsLayer = L.featureGroup() //Contains markers of stations that are going to be added to a line

let map = L.map('map', {
  center: [35.20118653849822, -0.6343081902114373],
  zoom: 14,
  maxZoom: 18,
  minZoom: 13,
})

const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  subdomains: ['a', 'b', 'c'],
})

function init() {
  tile.addTo(map)
  console.log('Map initialized')
}

function clearMap() {
  map.eachLayer(layer => {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) map.removeLayer(layer)
  })
  linelayer.clearLayers()
  drawsLayer.clearLayers()
}

function centerMap() {
  map.flyTo(new L.LatLng(35.20118653849822, -0.6343081902114373), 14)
}

function addStationToMap(station, layer, line) {
  let url = ''
  if (line === 'tramway') url = './static/icons/markers/pin_subway.png'
  if (line === 'Ligne 03') url = './static/icons/markers/pin_bus_3.png'
  if (line === 'Ligne 03 bis') url = './static/icons/markers/pin_bus_3.png'
  if (line === 'Ligne 11') url = './static/icons/markers/pin_bus_11.png'
  if (line === 'Ligne 16') url = './static/icons/markers/pin_bus_16.png'
  if (line === 'Ligne 17') url = './static/icons/markers/pin_bus_17.png'
  if (line === 'Ligne 22') url = './static/icons/markers/pin_bus_22.png'
  if (line === 'Ligne 25') url = './static/icons/markers/pin_bus_25.png'
  if (line === 'Ligne 27') url = './static/icons/markers/pin_bus_27.png'
  let iconOptions = L.icon({
    iconUrl: url,
    iconSize: [35, 35], // size of the icon
    iconAnchor: [17.5, 35], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
  })
  let marker
  let popup = '<div class="markerPopup">'
  popup += '<b>' + station.name + '</b>'
  popup += '</div>'

  if (url !== '')
    marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], {
      item: station,
      icon: iconOptions,
    }).bindPopup(popup)
  else
    marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], {
      item: station,
    }).bindPopup(popup)
  if (layer === 'line') marker.addTo(linelayer)
  else if (layer === 'draw') marker.addTo(drawsLayer)
}

function addPolylineToMap(path, color, layer) {
  let pathArray = []
  for (let i = 0; i < path.length; i++) pathArray.push([path[i].latitude, path[i].longitude])
  let poly = L.polyline(pathArray, { weight: 3, color: color, item: path })

  if (layer === 'line') poly.addTo(linelayer)
  else if (layer === 'draw') {
    poly.addTo(drawsLayer)
    drawsLayer.addTo(map)
  }
}

map.on('draw:editstart', function (e) {
  var icons = document.getElementsByClassName('leaflet-touch-icon')
  for (var i = 0; i < icons.length; i++) {
    icons[i].style.width = '2px'
    icons[i].style.height = '2px'
  }
})
