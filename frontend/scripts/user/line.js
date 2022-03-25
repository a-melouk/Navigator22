//------------------------------------Populating the SELECTs------------------------------------//
//Fetching all available lines
let populate = () => {
  const right = document.getElementsByClassName('Lines')
  right[0].replaceChildren()
  getAllLinesNamesIdsDb().then(data => {
    data.forEach(item => {
      let line = document.createElement('button')
      line.innerText = toTitleCase(item.name)
      if (item.name === 'tramway') line.classList.add('lines', 'tramway')
      else line.classList.add('lines', 'bus')
      line.onclick = function () {
        addLineToMap.call(this, item.name)
      }
      right[0].appendChild(line)
    })
  })
}

function populateWithAllStations() {
  fetch('http://localhost:4000/stations').then(data =>
    data.json().then(result => {
      result.forEach(item => {
        let station_name = document.createElement('div')
        let station_line = document.createElement('div')
        let station_id = document.createElement('div')
        let station_latitude = document.createElement('div')
        let station_longitude = document.createElement('div')
        station_name.innerHTML = item.name
        station_name.classList.add('station-name')
        station_line.innerHTML = item.line
        station_id.innerHTML = item._id
        station_latitude.innerHTML = item.coordinates.latitude
        station_longitude.innerHTML = item.coordinates.longitude
        station_id.hidden = true
        station_latitude.hidden = true
        station_longitude.hidden = true
        let station = document.createElement('div')
        station.appendChild(station_name)
        station.appendChild(station_line)
        station.appendChild(station_id)
        station.appendChild(station_latitude)
        station.appendChild(station_longitude)
        station.classList.add('station')
        document.getElementById('stations').appendChild(station)
      })
    })
  )
}

let inputs = document.getElementsByTagName('input')
let fromInput = inputs[0]
let toInput = inputs[1]
fromInput.addEventListener('keyup', e => search(e))
toInput.addEventListener('keyup', e => search(e))

function search(e) {
  let filter = document.activeElement.value.toUpperCase()
  let stations = document.getElementById('stations')

  for (let i = 0; i < stations.children.length; i++) {
    let station = stations.children[i]
    let station_name = station.children[0].innerHTML
    if (station_name.toUpperCase().indexOf(filter) > -1) {
      station.style.display = ''
      station.addEventListener('click', () => {
        e.target.value = station.children[0].innerHTML
        document.getElementsByClassName('stations')[0].replaceChildren()
        populateWithAllStations()
      })
    } else station.style.display = 'none'
  }
}

/* for (let i = 0; i < inputs.length; i++) {
  inputs[i].addEventListener('keyup', e => {
    let focused = document.activeElement
    let filter = document.activeElement.value.toUpperCase()
    let stations = document.getElementById('stations')

    for (let i = 0; i < stations.children.length; i++) {
      let station = stations.children[i]
      let station_name = station.children[0].innerHTML
      if (station_name.toUpperCase().indexOf(filter) > -1) {
        station.style.display = ''
        station.addEventListener('click', () => {
          console.log(focused)
          e.target.value = station.children[0].innerHTML
        })
      } else station.style.display = 'none'
    }
  })
} */

function searchBar() {
  // let from = document.getElementById('from')
  console.log(active_input)
  console.log(document.activeElement)
  let filter = document.activeElement.value.toUpperCase()
  let stations = document.getElementById('stations')

  for (let i = 0; i < stations.children.length; i++) {
    let station = stations.children[i]
    let station_name = station.children[0].innerHTML
    if (station_name.toUpperCase().indexOf(filter) > -1) station.style.display = ''
    else station.style.display = 'none'
  }
}

function addLineToMap(number) {
  clearMap(true)
  getLineByNameDb(number).then(data => {
    data.stations.forEach(item => addStationToMap(item, 'line', number))
    data.route.forEach(item => addPolylineToMap(item, 'black', 'line'))
    linelayer.addTo(map)
    map.fitBounds(linelayer.getBounds())
  })
}
