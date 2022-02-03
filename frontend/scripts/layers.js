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

clearMap = () => {
  map.eachLayer((layer) => {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) map.removeLayer(layer)
  })
  map.removeControl(drawControl)
  linelayer.clearLayers()
  segmentLayer.clearLayers()
  markersLayer.clearLayers()
  drawsLayer.clearLayers()
}

clearMapWithoutDrawControl = () => {
  map.eachLayer((layer) => {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) map.removeLayer(layer)
  })
  // map.removeControl(drawControl)
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
    }).bindPopup('<b>' + station.name + '</b>')
  else
    marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], {
      item: station,
    }).bindPopup('<b>' + station.name + '</b>')
  if (layer === 'segment') marker.addTo(segmentLayer)
  else if (layer === 'line') marker.addTo(linelayer)
  else if (layer === 'markers') marker.addTo(markersLayer)
}

function addPolylineToMap(path, color, layer) {
  let pathArray = []
  for (let i = 0; i < path.length; i++)
    pathArray.push([path[i].latitude, path[i].longitude])
  let poly = L.polyline(pathArray, { color: color, item: path })

  if (layer === 'segment') {
    poly.addTo(segmentLayer)
    map.fitBounds(poly.getBounds())
  } else if (layer === 'line') poly.addTo(linelayer)
}

let originalSegment = {}
function addSegment(segment, color, layer) {
  clearMap()
  addStationToMap(segment.from, layer, segment.line)
  addStationToMap(segment.to, layer, segment.line)
  addPolylineToMap(segment.path, color, layer)
  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: false,
    edit: {
      featureGroup: segmentLayer,
    },
  })
  drawControl.addTo(map)
  originalSegment = segment
}

map.on('draw:edited', function () {
  map.removeControl(drawControl)
  let choosenLine = document.getElementById('line').value

  if (segmentLayer.getLayers().length > 0) {
    let tempLayers = segmentLayer.getLayers()

    let modifiedFrom = false,
      modifiedTo = false,
      modifiedPath = false

    //New segment's from
    let from = {
      name: tempLayers[0].options.item.name,
      coordinates: {
        latitude: tempLayers[0]._latlng.lat,
        longitude: tempLayers[0]._latlng.lng,
      },
      id: tempLayers[0].options.item.id,
    }

    //New segment's to
    let to = {
      name: tempLayers[1].options.item.name,
      coordinates: {
        latitude: tempLayers[1]._latlng.lat,
        longitude: tempLayers[1]._latlng.lng,
      },
      id: tempLayers[1].options.item.id,
    }

    //New segment's path
    let path = []
    let tempPath = tempLayers[2]._latlngs
    tempPath.forEach((item) => {
      let coordinates = {
        latitude: item.lat,
        longitude: item.lng,
      }
      path.push(coordinates)
    })

    //Patch if stations coordinates were updated
    if (trueIfDifferent(from.coordinates, originalSegment.from.coordinates)) {
      modifiedFrom = true
      modifiedPath = true
    }
    if (trueIfDifferent(to.coordinates, originalSegment.to.coordinates)) {
      modifiedTo = true
      modifiedPath = true
    }

    if (path.length === originalSegment.path.length) {
      for (let i = 0; i < path.length; i++) {
        if (trueIfDifferent(path[i], originalSegment.path[i])) {
          modifiedPath = true
          break
        }
      }
    } else modifiedPath = true

    if (modifiedFrom) {
      patchStation(from.id, from)
      getRelatedSegment('from', from.id).then((data) => {
        if (typeof data !== 'undefined') {
          let tempPath = data.path
          tempPath.pop()
          tempPath.push(from.coordinates)
          removeClosePoints(tempPath)
          let temp = {
            from: data.from,
            to: from,
            path: tempPath,
          }
          patchSegment(data._id, temp).then(() =>
            console.log('Related segment patched successfully')
          )
        }
      })
    }

    if (modifiedTo) {
      patchStation(to.id, to)
      getRelatedSegment('to', to.id).then((data) => {
        if (typeof data !== 'undefined') {
          let tempPath = data.path
          tempPath.shift()
          tempPath.unshift(to.coordinates)
          removeClosePoints(tempPath)
          let temp = {
            from: to,
            to: data.to,
            path: tempPath,
          }
          patchSegment(data._id, temp).then(() =>
            console.log('Related segment patched successfully')
          )
        }
      })
    }

    //The polyline always start with FROM coordinate and ends with TO coordinates
    if (trueIfDifferent(path[0], from.coordinates)) {
      path.unshift(from.coordinates)
      modifiedPath = true
    }
    if (trueIfDifferent(path[path.length - 1], to.coordinates)) {
      path.push(to.coordinates)
      modifiedPath = true
    }

    for (let i = 0; i < path.length - 2; i++)
      if (
        map.distance(
          [path[i].latitude, path[i].longitude],
          [path[i + 1].latitude, path[i + 1].longitude]
        ) < 4.5
      ) {
        path.splice(i + 1, 1)
        modifiedPath = true
      }

    if (
      map.distance(
        [path[path.length - 2].latitude, path[path.length - 2].longitude],
        [path[path.length - 1].latitude, path[path.length - 1].longitude]
      ) < 4.5
    ) {
      path.splice(path.length - 2, 1)
      modifiedPath = true
    }

    let temp = {
      from: from,
      to: to,
      path: path,
      line: originalSegment.line,
    }

    if (modifiedPath) {
      patchSegment(segmentLayer.options.id, temp).then(() => {
        console.log('Segment patched successfully')
        clearMap()
        addSegment(temp, 'red', 'segment')
        getStationsByLine(JSON.parse(choosenLine).name)
      })
    }
  }
})
