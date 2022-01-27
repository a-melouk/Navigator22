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
