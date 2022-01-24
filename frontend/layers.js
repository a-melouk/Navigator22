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
  let confirm = prompt('Confirm adding the line', 'No')
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

function compareCoordinates(a, b) {
  if (a.latitude !== b.latitude) return true
  if (a.longitude !== b.longitude) return true
  return false
}

map.on('draw:edited', function (e) {
  let layers = e.layers
  layers.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) {
      console.log('Updated Polyline', layer._latlngs)
    } else if (layer instanceof L.Marker) {
      console.log('Updated Marker', '{latitude: ' + layer._latlng.lat + ', longitude: ' + layer._latlng.lng + '}')
    }
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
    let choosenLine = document.getElementById('line').value

    if (from.coordinates.latitude !== originalSegment.from.coordinates.latitude && from.coordinates.longitude !== originalSegment.from.coordinates.longitude) modifiedFrom = true

    if (to.coordinates.latitude !== originalSegment.to.coordinates.latitude && to.coordinates.longitude !== originalSegment.to.coordinates.longitude) modifiedTo = true

    if (path.length === originalSegment.path.length) {
      console.log('Same length')
      for (let i = 0; i < path.length; i++) {
        if (compareCoordinates(path[i], originalSegment.path[i])) {
          modifiedPath = true
          console.log('First different coordinates: ', i)
          break
        }
      }
    } else modifiedPath = true

    if (modifiedFrom) {
      modifiedPath = true
      /* fetch(baseURI + 'station?id=' + from.id, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(from),
      })
        .then((data) => {
          data.json()
          console.log('Patched FROM successfully')
        })
        .catch((err) => console.log(err)) */

      fetch(baseURI + 'segment/to?id=' + from.id)
        .then((response) => response.json())
        .then((data) => {
          console.log('Affected Segment with FROM station: ', data)
        })
        .catch((err) => console.log(err))
    }

    if (modifiedTo) {
      modifiedPath = true
      /* fetch(baseURI + 'station?id=' + to.id, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(to),
      })
        .then((data) => {
          data.json()
          console.log('Patched TO successfully')
        })
        .catch((err) => console.log(err)) */
      fetch(baseURI + 'segment/from?id=' + to.id)
        .then((response) => response.json())
        .then((data) => {
          console.log('Affected Segment with TO station: ', data)
        })
        .catch((err) => console.log(err))
    }

    //The polyline always start with FROM coordinate and ends with TO coordinates
    if (modifiedPath) {
      path.unshift(from.coordinates)
      path.push(to.coordinates)
    }

    let temp = {
      from: from,
      to: to,
      path: path,
    }

    if (modifiedPath) {
      /* fetch(baseURI + 'segment?id=' + segmentLayer.options.id, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(temp),
      })
        .then((data) => {
          data.json()
          console.log('Patched the segment successfully')
        })
        .catch((err) => console.log(err)) */
    }

    getStationsByLine(choosenLine)
    clearMap()
    addSegment(temp, 'red', 'segment')
  }
})
