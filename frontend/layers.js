const baseURI = 'http://localhost:4000/'
let linelayer = L.featureGroup() //Contains markers and polyline
let segmentLayer = L.featureGroup() //Contains markers and polyline
let partLayer = L.featureGroup() //Contains markers and polyline
let markersLayer = L.featureGroup() //Contains markers and polyline

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
  })
  map.removeControl(drawControl)
  linelayer.clearLayers()
  segmentLayer.clearLayers()
}

function centerMap() {
  map.flyTo(new L.LatLng(35.20118653849822, -0.6343081902114373), 14)
}

function addStation(station, layer, line) {
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
  if (url !== '') marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], { item: station, icon: iconOptions }).bindPopup('<b>' + station.name + '</b>')
  else marker = L.marker([station.coordinates.latitude, station.coordinates.longitude], { item: station }).bindPopup('<b>' + station.name + '</b>')
  if (layer === 'segment') marker.addTo(segmentLayer)
  else if (layer === 'line') marker.addTo(linelayer)
  // else if (layer === 'markers') marker.addTo(markersLayer)
}

function addPolyline(path, color, layer) {
  let pathArray = []
  for (let i = 0; i < path.length; i++) pathArray.push([path[i].latitude, path[i].longitude])
  let poly = L.polyline(pathArray, { color: color, item: path })
  if (layer === 'segment') poly.addTo(segmentLayer)
  else if (layer === 'line') poly.addTo(linelayer)
}

let originalSegment = {}
function addSegment(segment, color, layer) {
  clearMap()
  addStation(segment.from, layer, segment.line)
  addStation(segment.to, layer, segment.line)
  addPolyline(segment.path, color, layer)
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
    fetch(baseURI + 'stations', {
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

  //Put FROM station at the beginning of the path
  point = {
    latitude: fromOptionValue.coordinates.latitude,
    longitude: fromOptionValue.coordinates.longitude,
  }
  path.unshift(point)

  //Put TO station at the end of the path
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
addline.addEventListener('click', () => {
  let line = {}
  line.name = lineElement.value
  if (lineElement.value === 'tramway') {
    line.type = 'tramway'
  } else {
    line.type = 'bus'
  }
  line.route = route
  console.log('New line to be added', line)
  let confirm = prompt('Confirm adding the line', 'No')
  if (confirm !== null && confirm.toLowerCase() === 'yes') {
    fetch(baseURI + 'lines', {
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

function trueIfDifferent(a, b) {
  if (a.latitude === b.latitude && a.longitude === b.longitude) return false
  return true
}

map.on('draw:edited', function (e) {
  map.removeControl(drawControl)
  let layers = e.layers
  let choosenLine = document.getElementById('line').value

  layers.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) console.log('Updated Polyline', layer._latlngs)
    else if (layer instanceof L.Marker) console.log('Updated Marker', '{latitude: ' + layer._latlng.lat + ', longitude: ' + layer._latlng.lng + '}')
  })
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
      console.log('Modified from')
    }
    console.log(to.coordinates)
    console.log(originalSegment.to.coordinates)
    if (trueIfDifferent(to.coordinates, originalSegment.to.coordinates)) {
      modifiedTo = true
      modifiedPath = true
      console.log('Modified to')
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
      fetch(baseURI + 'station?id=' + from.id, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(from),
      })
        .then((data) => data.json())
        .catch((err) => console.log(err))

      //Get Cascades Ghalmi after updating Ghalmi Adnane
      fetch(baseURI + 'segment/to?id=' + from.id)
        .then((response) => response.json())
        .then((data) => {
          console.log('Patching affected segment 10')
          if (data.from != undefined) {
            console.log('Patching affected segment 11')
            let tempPath = data.path
            tempPath.pop()
            tempPath.push(from.coordinates)
            let temp = {
              from: data.from,
              to: from,
              path: tempPath,
            }

            fetch(baseURI + 'segment?id=' + data._id, {
              method: 'PATCH',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(temp),
            })
              .then((data) => data.json())
              .catch((err) => console.log(err))
          }
        })
        .catch((err) => console.log(err))
    }

    if (modifiedTo) {
      fetch(baseURI + 'station?id=' + to.id, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(to),
      })
        .then((data) => data.json())
        .catch((err) => console.log(err))

      //Get Adnane Benhamouda after updating Ghalmi Adnane
      fetch(baseURI + 'segment/from?id=' + to.id)
        .then((response) => response.json())
        .then((data) => {
          console.log('Patching affected segment 13')
          if (data.from != undefined) {
            console.log('Patching affected segment 14')
            let tempPath = data.path
            tempPath.shift()
            tempPath.unshift(to.coordinates)
            let temp = {
              from: to,
              to: data.to,
              path: tempPath,
            }
            fetch(baseURI + 'segment?id=' + data._id, {
              method: 'PATCH',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(temp),
            })
              .then((data) => data.json())
              .catch((err) => console.log(err))
          }
        })
        .catch((err) => console.log(err))
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

    let temp = {
      from: from,
      to: to,
      path: path,
      line: originalSegment.line,
    }

    if (modifiedPath) {
      fetch(baseURI + 'segment?id=' + segmentLayer.options.id, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(temp),
      })
        .then((data) => data.json())
        .catch((err) => console.log(err))
        .then(() => {
          clearMap()
          addSegment(temp, 'red', 'segment')
          getStationsByLine(choosenLine)
        })
    }
  }
})
