//Needed when you want to add a new line
function populateListsToAddNewSegment(line) {
  getStationsByLineForAdd(line).then((data) => {
    if (line === 'Ligne 03') {
      let temp = [...data].reverse()
      data = temp
    }
    populateList(data, 'from')
    populateList(data, 'to')
  })
}

function newStation(layer) {
  let station = {
    coordinates: {
      latitude: layer.getLatLng().lat,
      longitude: layer.getLatLng().lng,
    },
    name: toTitleCase(prompt('Name of the station', '')),
    line: prompt('Line ?', 'tramway'),
  }
  let confirm = prompt('Confirm adding the station', 'No')
  if (confirm.toLowerCase() === 'yes')
    postStation(station).then(() => console.log('Station added successfully'))
}

let route = []
let lastValue = 1
function newSegment(layer) {
  let polyline = layer.getLatLngs()
  let path = []
  let point = {}
  polyline.forEach((item) => {
    point = {
      latitude: item.lat,
      longitude: item.lng,
    }
    path.push(point)
  })

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
    id: fromOptionValue._id, //change to _id when adding a new line because we add segment by using stations data
  }

  let to = {
    name: toOptionValue.name,
    coordinates: toOptionValue.coordinates,
    id: toOptionValue._id, //change to _id when adding a new line because we add segment by using stations data
  }

  let segment = {
    from: from,
    to: to,
    path: path,
    // order: order,
  }

  let choice = prompt('What to do ?', 'New segment to line')
  if (choice.toLowerCase() === 'new segment to line') {
    patchLine(JSON.parse(document.getElementById('line').value)._id, segment)
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
