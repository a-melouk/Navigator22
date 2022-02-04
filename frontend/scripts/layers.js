let linelayer = L.featureGroup() //Contains markers and polyline of a line
let segmentLayer = L.featureGroup() //Contains markers and polyline of a segment
let markersLayer = L.featureGroup() //Contains markers of stations that are goind to be added to a line
let drawsLayer = L.featureGroup() //Contains markers of stations that are goind to be added to a line

let map = L.map('map', {
  center: [35.20118653849822, -0.6343081902114373],
  zoom: 14,
  maxZoom: 18,
  minZoom: 13,
})

const tile = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  subdomains: ['a', 'b', 'c'],
})

drawControl = new L.Control.Draw({
  position: 'topright',
  draw: false,
  edit: false,
})

function init() {
  tile.addTo(map)
  drawControl.addTo(map)
  console.log('Map initialized')
}

clearMap = (draw) => {
  map.eachLayer((layer) => {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) map.removeLayer(layer)
  })
  if (draw) map.removeControl(drawControl)
  linelayer.clearLayers()
  segmentLayer.clearLayers()
  markersLayer.clearLayers()
  drawsLayer.clearLayers()
}

function centerMap() {
  map.flyTo(new L.LatLng(35.20118653849822, -0.6343081902114373), 14)
}

function addStationToMap(station, layer, line) {
  let url = ''
  if (line === 'tramway') url = './icons/pin_subway.png'
  if (line === 'Ligne 03') url = './icons/pin_bus_3.png'
  if (line === 'Ligne 03 bis') url = './icons/pin_bus_3.png'
  if (line === 'Ligne 11') url = './icons/pin_bus_11.png'
  if (line === 'Ligne 16') url = './icons/pin_bus_16.png'
  if (line === 'Ligne 17') url = './icons/pin_bus_17.png'
  if (line === 'Ligne 22') url = './icons/pin_bus_22.png'
  if (line === 'Ligne 25') url = './icons/pin_bus_25.png'
  if (line === 'Ligne 27') url = './icons/pin_bus_27.png'
  let iconOptions = L.icon({
    iconUrl: url,
    iconSize: [35, 35], // size of the icon
    iconAnchor: [17.5, 35], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
  })
  let marker
  if (url !== '')
    marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], {
      item: station,
      icon: iconOptions,
    }).bindPopup('<div class="markerPopup">' + '<b>' + station.name + '</b>' + '<div class="operations">' + '<button onClick=' + 'deleteStation("' + station.id + '");' + 'deleteStationFromSegment("' + station.id + '");' + '>Delete</button>' + '</div>' + '</div>')
  else
    marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], {
      item: station,
    }).bindPopup('<div class="markerPopup">' + '<b>' + station.name + '</b>' + '<div class="operations">' + '<button onClick=' + 'deleteStation("' + station.id + '");' + 'deleteStationFromSegment("' + station.id + '");' + '>Delete</button>' + '</div>' + '</div>')
  if (layer === 'segment') marker.addTo(segmentLayer)
  else if (layer === 'line') marker.addTo(linelayer)
  else if (layer === 'markers') marker.addTo(markersLayer)
}

function addPolylineToMap(path, color, layer) {
  let pathArray = []
  for (let i = 0; i < path.length; i++) pathArray.push([path[i].latitude, path[i].longitude])
  let poly = L.polyline(pathArray, { color: color, item: path })

  if (layer === 'segment') {
    poly.bindPopup('<b>' + layer.options + '</b>')
    poly.addTo(segmentLayer)
    map.fitBounds(poly.getBounds())
  } else if (layer === 'line') poly.addTo(linelayer)
}

function addDrawControlToMap(type, layer) {
  if (type === 'only-edit') {
    if (layer === 'segment')
      drawControl = new L.Control.Draw({
        position: 'topright',
        draw: false,
        edit: {
          featureGroup: segmentLayer,
        },
      })
  } else if (type === 'only-draw') {
    drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
      },
      edit: false,
    })
  }
  drawControl.addTo(map)
}
