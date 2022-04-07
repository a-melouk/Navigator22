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
const toID = '61eb2de817e57cb86cb3f90d'

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
let raw = {}
const rawJson = fetch('../../../test.json')
  .then(response => response.json())
  .then(raw => {
    separateSegments(raw.path)
  })

const steps = document.getElementById('steps')

function separateSegments(rawData) {
  let i = 1
  let first = rawData[0].from.name
  let last = rawData[0].to.name
  let mean = rawData[0].mean
  let duration = rawData[0].duration
  let stops = 1
  if (rawData.length === 1) {
    console.log(first, last, mean, duration, stops)
    steps.appendChild(createStep({ first: first, last: last, mean: mean, duration: duration, stops: stops }))
  } else
    while (i < rawData.length) {
      if (rawData[i].mean !== mean) {
        console.log(first, last, mean, duration, stops)
        steps.appendChild(createStep({ first: first, last: last, mean: mean, duration: duration, stops: stops }))
        first = rawData[i].from.name
        last = rawData[i].to.name
        mean = rawData[i].mean
        stops = 1
        duration = rawData[i].duration
      } else {
        last = rawData[i].to.name
        duration += rawData[i].duration
        stops++
      }
      if (i === rawData.length - 1) {
        if (mean === rawData[rawData.length - 2].mean) {
          last = rawData[rawData.length - 1].to.name
          console.log(first, last, mean, duration, stops)

          // let imgMean = document.createElement('img')
          // imgMean.setAttribute('alt', mean)
          // if (mean.includes('Ligne')) imgMean.setAttribute('src', 'static/icons/means-colored/bus.png')
          // else imgMean.setAttribute('src', 'static/icons/means-colored/' + mean + '.png')
          steps.appendChild(createStep({ first: first, last: last, mean: mean, duration: duration, stops: stops }))
        } else {
          first = rawData[rawData.length - 1].from.name
          last = rawData[rawData.length - 1].to.name
          duration = rawData[rawData.length - 1].duration
          mean = rawData[rawData.length - 1].mean
          stops = 1
          console.log(first, last, mean, duration, stops)

          // let imgMean = document.createElement('img')
          // imgMean.setAttribute('alt', mean)
          // if (mean.includes('Ligne')) imgMean.setAttribute('src', 'static/icons/means-colored/bus.png')
          // else imgMean.setAttribute('src', 'static/icons/means-colored/' + mean + '.png')
          steps.appendChild(createStep({ first: first, last: last, mean: mean, duration: duration, stops: stops }))
          // console.log('Changement')
        }
      }
      i++
    }
}

/*
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
*/

function createImg(mean) {
  let imgMean = document.createElement('img')
  imgMean.setAttribute('alt', mean)
  imgMean.setAttribute('src', 'static/icons/circle_ways/' + mean + '.svg')
  return imgMean
}

function createStep(details) {
  let first = document.createElement('div')
  let last = document.createElement('div')
  let stops_duration = document.createElement('div')
  let detailsDiv = document.createElement('div')
  let step = document.createElement('div')

  first.innerHTML = details.first
  last.innerHTML = details.last
  stops_duration.innerHTML = details.stops + ' stops | ' + details.duration + ' minutes'

  detailsDiv.append(first, last, stops_duration)
  detailsDiv.classList.add('details')

  step.appendChild(createImg(details.mean))
  step.appendChild(detailsDiv)
  step.classList.add('step')
  return step
}
