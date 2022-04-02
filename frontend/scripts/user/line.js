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

async function populateWithAllStations() {
  let response = await fetch('http://localhost:4000/stations')
  let result = await response.json()
  for (let i = 0; i < result.length; i++) {
    let station_name = document.createElement('div')
    let station_line = document.createElement('div')
    let station_id = document.createElement('div')
    let station_latitude = document.createElement('div')
    let station_longitude = document.createElement('div')
    station_name.innerHTML = result[i].name
    station_name.classList.add('station-name')
    station_line.innerHTML = result[i].line
    station_id.innerHTML = result[i]._id
    station_latitude.innerHTML = result[i].coordinates.latitude
    station_longitude.innerHTML = result[i].coordinates.longitude
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
  }
}

let inputs = document.getElementsByTagName('input')
let fromInput = inputs[0]
let toInput = inputs[1]
const fromID = '61eb2de817e57cb86cb3f8f9'
const toID = '61eb2de817e57cb86cb3f90c'

//TODO: Fix listeners for all stations
/*
fromInput.addEventListener('keyup', searchFrom)
toInput.addEventListener('keyup', searchTo)

function searchFrom() {
  let filterValue = fromInput.value.toUpperCase()
  let stations = document.getElementById('stations')
  stations.style.display = ''

  for (let i = 0; i < stations.children.length; i++) {
    let station = stations.children[i]
    let station_name = station.children[0].innerHTML
    if (station_name.toUpperCase().indexOf(filterValue) > -1) {
      station.style.display = ''
      station.addEventListener(
        'click',
        () => {
          fromInput.value = station.children[0].innerHTML
          fromID = station.children[2].innerHTML
          stations.replaceChildren()
          populateWithAllStations()
        },
        { once: true }
      )
    } else station.style.display = 'none'
  }
}

function searchTo() {
  let filterValue = toInput.value.toUpperCase()
  let stations = document.getElementById('stations')
  stations.style.display = ''

  for (let i = 0; i < stations.children.length; i++) {
    let station = stations.children[i]
    let station_name = station.children[0].innerHTML
    if (station_name.toUpperCase().indexOf(filterValue) > -1) {
      station.style.display = ''
      station.addEventListener(
        'click',
        () => {
          toInput.value = station.children[0].innerHTML
          toID = station.children[2].innerHTML
          stations.replaceChildren()
          populateWithAllStations()
        },
        { once: true }
      )
    } else station.style.display = 'none'
  }
}
*/

getroute.addEventListener('click', () => {
  clearMap(true)
  // const from = JSON.parse(fromElement.value)._id
  // const to = JSON.parse(toElement.value)._id

  getRoute(fromID, toID).then(route => {
    route.path.forEach(segment => {
      addStationToMap(segment.from, 'draw', segment.from.line)
      addStationToMap(segment.to, 'draw', segment.to.line)
      if (segment.mean === 'tramway') addPolylineToMap(segment.segment, '#f47e1b', 'draw')
      else if (segment.mean === 'walk') addPolylineToMap(segment.segment, '#1d691f', 'draw')
      else addPolylineToMap(segment.segment, '#3338d2', 'draw')
    })
    drawsLayer.addTo(map)
    map.fitBounds(drawsLayer.getBounds())
    // let distance = route.distance
    // let duration = route.duration
    // let hours = Math.floor(duration / 3600)
    // let minutes = Math.floor((duration - Math.floor(duration / 3600) * 3600) / 60)
    // let seconds = duration - Math.floor(duration / 3600) * 3600 - Math.floor((duration - Math.floor(duration / 3600) * 3600) / 60) * 60
    // console.log(route.from.coordinates.latitude, route.from.coordinates.longitude)
    // console.log(route.to.coordinates.latitude, route.to.coordinates.longitude)
    // if (Math.floor(distance / 1000) === 0) console.log(distance + 'm')
    // else console.log(distance / 1000 + 'km')
    // if (hours > 0) console.log(hours + ' hours, ' + minutes + ' minutes, ' + seconds + ' seconds')
    // else if (minutes > 0) console.log(minutes + ' minutes, ' + seconds + ' seconds')
    // else if (seconds > 0) console.log(seconds + ' seconds')
    // else console.log('Error')
  })
})

function addLineToMap(number) {
  clearMap(true)
  getLineByNameDb(number).then(data => {
    data.stations.forEach(item => addStationToMap(item, 'line', number))
    data.route.forEach(item => addPolylineToMap(item, 'black', 'line'))
    linelayer.addTo(map)
    map.fitBounds(linelayer.getBounds())
  })
}

const raw = {
  from: { line: 'tramway', name: 'Les Cascades', coordinates: { latitude: 35.20902474807825, longitude: -0.6162750701035336 } },
  to: { line: 'tramway', name: '4 Horloges', coordinates: { latitude: 35.190692015918486, longitude: -0.6345291159063461 } },
  duration: 1539,
  path: [
    {
      from: { line: 'tramway', name: 'Les Cascades', coordinates: { latitude: 35.20902474807825, longitude: -0.6162750701035336 } },
      to: { line: 'tramway', name: 'Ghalmi Gare Routiere Est', coordinates: { latitude: 35.21326746334253, longitude: -0.615711808204651 } },
      duration: 105,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Ghalmi Gare Routiere Est', coordinates: { latitude: 35.21326746334253, longitude: -0.615711808204651 } },
      to: { line: 'tramway', name: 'Les Freres Adnane', coordinates: { latitude: 35.21683928147929, longitude: -0.6147944927215577 } },
      duration: 112,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Les Freres Adnane', coordinates: { latitude: 35.21683928147929, longitude: -0.6147944927215577 } },
      to: { line: 'tramway', name: 'Benhamouda', coordinates: { latitude: 35.21742217872461, longitude: -0.6211030483245851 } },
      duration: 120,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Benhamouda', coordinates: { latitude: 35.21742217872461, longitude: -0.6211030483245851 } },
      to: { line: 'tramway', name: 'Environnement', coordinates: { latitude: 35.216100966557406, longitude: -0.6244219586929579 } },
      duration: 92,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Environnement', coordinates: { latitude: 35.216100966557406, longitude: -0.6244219586929579 } },
      to: { line: 'tramway', name: 'Sidi Djilali', coordinates: { latitude: 35.21592551912779, longitude: -0.623576045036316 } },
      duration: 109,
      mean: 'walk',
    },
    {
      from: { line: 'tramway', name: 'Sidi Djilali', coordinates: { latitude: 35.21592551912779, longitude: -0.623576045036316 } },
      to: { line: 'tramway', name: 'Wiam', coordinates: { latitude: 35.21138935217449, longitude: -0.6279587751480654 } },
      duration: 148,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Wiam', coordinates: { latitude: 35.21138935217449, longitude: -0.6279587751480654 } },
      to: { line: 'tramway', name: 'Daira', coordinates: { latitude: 35.2059556923662, longitude: -0.6264588860800592 } },
      duration: 131,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Daira', coordinates: { latitude: 35.2059556923662, longitude: -0.6264588860800592 } },
      to: { line: 'tramway', name: 'Houari Boumediene', coordinates: { latitude: 35.19968750451939, longitude: -0.6247530013102365 } },
      duration: 154,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Houari Boumediene', coordinates: { latitude: 35.19968750451939, longitude: -0.6247530013102365 } },
      to: { line: 'tramway', name: 'Radio', coordinates: { latitude: 35.19631518609869, longitude: -0.6208536049211122 } },
      duration: 109,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Radio', coordinates: { latitude: 35.19631518609869, longitude: -0.6208536049211122 } },
      to: { line: 'tramway', name: 'Maternite', coordinates: { latitude: 35.19250346639613, longitude: -0.61917400655926 } },
      duration: 115,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Maternite', coordinates: { latitude: 35.19250346639613, longitude: -0.61917400655926 } },
      to: { line: 'tramway', name: 'Salle Adda Boudjelal', coordinates: { latitude: 35.191784501749964, longitude: -0.6251993151375924 } },
      duration: 115,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Salle Adda Boudjelal', coordinates: { latitude: 35.191784501749964, longitude: -0.6251993151375924 } },
      to: { line: 'tramway', name: 'Amir Abdelkader', coordinates: { latitude: 35.19119851214091, longitude: -0.6301510309059722 } },
      duration: 99,
      mean: 'tramway',
    },
    {
      from: { line: 'tramway', name: 'Amir Abdelkader', coordinates: { latitude: 35.19119851214091, longitude: -0.6301510309059722 } },
      to: { line: 'tramway', name: '4 Horloges', coordinates: { latitude: 35.190692015918486, longitude: -0.6345291159063461 } },
      duration: 130,
      mean: 'tramway',
    },
  ],
}

const steps = document.getElementById('steps')
let i = 0
let duration = 0
let stops = 1
let firstStation = raw.path[0].from.name
let towards = raw.path[0].to.name
for (let i = 0; i < raw.path.length - 1; i++) {
  if (raw.path[i].mean === raw.path[i + 1].mean) {
    towards = raw.path[i + 1].to.name
    duration += raw.path[i].duration
    stops++
    if (raw.path[i + 1].to.name === '4 Horloges') {
      duration += raw.path[i + 1].duration
      let stepName = document.createElement('div')
      let stepTowards = document.createElement('div')
      let stepStopsDuration = document.createElement('div')
      stepName.innerHTML = firstStation
      stepTowards.innerHTML = towards
      stepStopsDuration.innerHTML = stops + ' stops | ' + duration + ' minutes'
      let details = document.createElement('div')
      details.append(stepName, stepTowards, stepStopsDuration)
      details.classList.add('details')
      let step = document.createElement('div')
      step.appendChild(details)
      step.classList.add('step')
      steps.appendChild(step)
    }
  } else {
    duration += raw.path[i].duration
    let stepName = document.createElement('div')
    let stepTowards = document.createElement('div')
    let stepStopsDuration = document.createElement('div')
    stepName.innerHTML = firstStation
    stepTowards.innerHTML = towards
    stepStopsDuration.innerHTML = stops + ' stops | ' + duration + ' minutes'
    let details = document.createElement('div')
    details.append(stepName, stepTowards, stepStopsDuration)
    details.classList.add('details')
    let step = document.createElement('div')
    step.appendChild(details)
    step.classList.add('step')
    steps.appendChild(step)
    firstStation = raw.path[i].to.name
    towards = raw.path[i + 1].to.name
    duration = 0
    stops = 1
  }
}
