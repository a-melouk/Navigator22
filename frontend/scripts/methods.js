//Fetching all available lines
let populate = () => {
  fetch(baseURI + 'lines/all')
    .then((response) => response.json())
    .then((data) => {
      populateList(data, 'line')
    })
}

//Needed when you want to add a new line
/* function getStationsByLine(line) {
  fetch(baseURI + 'stations/' + line)
    .then((response) => response.json())
    .then((data) => {
      if (line === 'Ligne 03') {
        let temp = [...data].reverse()
        data = temp
      }
      populateList(data, 'from')
      populateList(data, 'to')
    })
} */

//Automatic pick
function getStationsByLine(line) {
  fetch(baseURI + 'lines/' + line + '/stations')
    .then((response) => response.json())
    .then((data) => {
      populateList(data.from, 'from')
      populateList(data.to, 'to')
    })
}

function populateList(data, id) {
  let list = document.getElementById(id)
  list.replaceChildren()
  let option = new Option('', '')
  option.disabled = true
  option.selected = true
  list.appendChild(option)
  data.forEach((item) => {
    option = new Option(item.name, JSON.stringify(item))
    list.appendChild(option)
  })
}

async function addLineToMap(number) {
  clearMap()
  const response = await fetch(baseURI + 'lines?name=' + number)
  let data = await response.json()
  data = data[0].route
  data.forEach((item) => {
    addStationToMap(item.from, 'line', number)
    addStationToMap(item.to, 'line', number)
    addPolylineToMap(item.path, 'black', 'line')
  })
  linelayer.addTo(map)
  map.fitBounds(linelayer.getBounds())
}

function removeClosePoints(path) {
  for (let i = 0; i < path.length - 2; i++) if (map.distance([path[i].latitude, path[i].longitude], [path[i + 1].latitude, path[i + 1].longitude]) < 4.5) path.splice(i + 1, 1)

  if (map.distance([path[path.length - 2].latitude, path[path.length - 2].longitude], [path[path.length - 1].latitude, path[path.length - 1].longitude]) < 4.5) path.splice(path.length - 2, 1)

  return path
}
