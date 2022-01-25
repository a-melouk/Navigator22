let populate = () => {
  fetch(baseURI + 'stations')
    .then((response) => response.json())
    .then((data) => {
      let lines = []
      data.forEach((item) => {
        lines.push(item.line)
      })
      lines = [...new Set(lines)]
      populateList(lines, 'line')
    })
}

function getStationsByLine(line) {
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
}

function populateList(data, id) {
  let list = document.getElementById(id)

  if (id === 'line') {
    data.forEach((item) => {
      let option = new Option(item, item)
      list.appendChild(option)
    })
  } else {
    list.replaceChildren()
    let option = new Option('', '')
    option.disabled = true
    option.selected = true
    list.appendChild(option)
    data.forEach((item) => {
      let option = new Option(item.name, JSON.stringify(item))
      list.appendChild(option)
    })
  }
}

async function addLine(number) {
  clearMap()
  const response = await fetch(baseURI + 'lines?name=' + number)
  let data = await response.json()
  data = data[0].route
  data.forEach((item) => {
    addStation(item.from, 'line', number)
    addStation(item.to, 'line', number)
    // addStation(item.from, 'line')
    // addStation(item.to, 'line')
    addPolyline(item.path, 'black', 'line')
  })
  linelayer.addTo(map)
}
