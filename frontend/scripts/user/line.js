async function populateWithAllStations() {
  let response = await fetch('http://localhost:4000/stations')
  let result = await response.json()
  let stations = document.getElementById('stations')
  stations.replaceChildren()
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

//TODO: Fix listeners for all stations

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
          populateWithAllStations()
          stations.style.display = 'none'
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
          populateWithAllStations()
          stations.style.display = 'none'
        },
        { once: true }
      )
    } else station.style.display = 'none'
  }
}

let fromID = '61eb2de817e57cb86cb3f943'
let toID = '61eb2de817e57cb86cb3f966'

const buttons = document.querySelectorAll('.mean')
buttons.forEach(mean => {
  mean.addEventListener('click', () => {
    let active_mean = document.getElementsByClassName('active')[0]
    active_mean.classList.remove('active')
    active_mean.classList.add('inactive')
    mean.classList.add('active')
    getRouteHandler(fromID, toID, mean.getAttribute('id'))
    // console.log(mean.getAttribute('id'))
  })
})

getroute.addEventListener('click', () => {
  clearMap(true)
  // const from = JSON.parse(fromElement.value)._id
  // const to = JSON.parse(toElement.value)._id
  let active_mean = document.getElementsByClassName('active')[0].getAttribute('id')
  getRoute(fromID, toID, active_mean).then(route => {
    if (active_mean === 'taxi') {
      addPolylineToMap(route.path, '#1d691f', 'draw')
      map.fitBounds(drawsLayer.getBounds())
      drawsLayer.addTo(map)
      steps.replaceChildren()
      steps.appendChild(createStep({ first: route.from, last: route.to, mean: active_mean, duration: route.duration, distance: route.distance }))
    } else {
      route.path.forEach(path => {
        addStationToMap(path.from, 'draw', path.from.line)
        addStationToMap(path.to, 'draw', path.to.line)
        if (path.mean === 'tramway') addPolylineToMap(path.segment, '#f47e1b', 'draw')
        else if (path.mean === 'walk') addPolylineToMap(path.segment, '#1d691f', 'draw')
        else addPolylineToMap(path.segment, '#3338d2', 'draw')
      })
      map.fitBounds(drawsLayer.getBounds())
      drawsLayer.addTo(map)
      steps.replaceChildren()
      separateSegments(route)
    }
  })
})

function getRouteHandler(from, to, mean) {
  clearMap(true)
  // const from = JSON.parse(fromElement.value)._id
  // const to = JSON.parse(toElement.value)._id

  getRoute(from, to, mean).then(route => {
    if (mean === 'taxi') {
      addPolylineToMap(route.path, '#1d691f', 'draw')
      map.fitBounds(drawsLayer.getBounds())
      drawsLayer.addTo(map)
      steps.replaceChildren()
      steps.appendChild(createStep({ first: route.from, last: route.to, mean: mean, duration: route.duration, distance: route.distance }))
    } else {
      route.path.forEach(path => {
        addStationToMap(path.from, 'draw', path.from.line)
        addStationToMap(path.to, 'draw', path.to.line)
        if (path.mean === 'tramway') addPolylineToMap(path.segment, '#f47e1b', 'draw')
        else if (path.mean === 'walk') addPolylineToMap(path.segment, '#1d691f', 'draw')
        else addPolylineToMap(path.segment, '#3338d2', 'draw')
      })
      map.fitBounds(drawsLayer.getBounds())
      drawsLayer.addTo(map)
      steps.replaceChildren()
      separateSegments(route)
    }
  })
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

const steps = document.getElementById('steps')

function separateSegments(route) {
  let path = route.path
  let i = 1
  let first = path[0].from.name
  let last = path[0].to.name
  let mean = path[0].mean
  let duration = path[0].duration
  let distance = path[0].distance
  let stops = 1

  if (route.mean !== 'walk' && route.mean !== 'taxi') {
    const means = getMeansOfRoute(route)
    let meansDiv = document.createElement('div')
    let durationDiv = document.createElement('div')
    let routeDiv = document.createElement('div')
    means.forEach(mean => meansDiv.appendChild(createImg(mean)))
    durationDiv.innerHTML = formatDuration(route.duration)
    meansDiv.classList.add('path-means')
    durationDiv.classList.add('duration')
    routeDiv.append(meansDiv, durationDiv)
    routeDiv.classList.add('route')
    steps.appendChild(routeDiv)
    steps.appendChild(document.createElement('hr'))
  }

  if (path.length === 1) {
    steps.appendChild(createStep({ first: first, last: last, mean: mean, duration: duration, stops: stops, distance: distance }))
  } else
    while (i < path.length) {
      if (path[i].mean !== mean) {
        steps.appendChild(createStep({ first: first, last: last, mean: mean, duration: duration, stops: stops, distance: distance }))
        first = path[i].from.name
        last = path[i].to.name
        mean = path[i].mean
        stops = 1
        duration = path[i].duration
        distance = path[i].distance
      } else {
        last = path[i].to.name
        duration += path[i].duration
        distance += path[i].distance
        stops++
      }
      if (i === path.length - 1) {
        if (mean === path[path.length - 2].mean) {
          last = path[path.length - 1].to.name
          distance = path[path.length - 1].distance
          console.log(distance)
          steps.appendChild(createStep({ first: first, last: last, mean: mean, duration: duration, stops: stops, distance: distance }))
        } else {
          first = path[path.length - 1].from.name
          last = path[path.length - 1].to.name
          duration = path[path.length - 1].duration
          distance = path[path.length - 1].distance
          mean = path[path.length - 1].mean
          stops = 1
          steps.appendChild(createStep({ first: first, last: last, mean: mean, duration: duration, stops: stops, distance: distance }))
        }
      }
      i++
    }
}

function createImg(mean) {
  let imgMean = document.createElement('img')
  imgMean.setAttribute('alt', mean)
  if (mean === 'Ligne 03 bis') imgMean.setAttribute('src', 'static/icons/circle_ways/Ligne 03.svg')
  else imgMean.setAttribute('src', 'static/icons/circle_ways/' + mean + '.svg')
  return imgMean
}

function createStep(segment) {
  let first = document.createElement('div')
  let last = document.createElement('div')
  let stops_duration = document.createElement('div')
  let detailsDiv = document.createElement('div')
  let step = document.createElement('div')

  first.innerHTML = segment.first
  last.innerHTML = segment.last
  if (segment.mean === 'walk' || segment.mean === 'taxi') stops_duration.innerHTML = formatDistance(segment.distance) + ', ' + formatDuration(segment.duration)
  else stops_duration.innerHTML = singular_plural(segment.stops, 'stop') + ' | ' + formatDuration(segment.duration)

  detailsDiv.append(first, last, stops_duration)
  detailsDiv.classList.add('details')

  step.appendChild(createImg(segment.mean))
  step.appendChild(detailsDiv)
  step.classList.add('step')
  return step
}

function getMeansOfRoute(route) {
  let means = []
  route.path.forEach(segment => means.push(segment.mean))
  means = [...new Set(means)]
  means = means.filter(mean => mean !== 'walk')
  return means
}

function formatDuration(duration) {
  if (typeof duration !== 'number') return new Error('Please provide a number')
  else {
    if (duration < 0) return new Error('Please provide a positive duration')
    else {
      let seconds = duration - Math.floor(duration / 3600) * 3600 - Math.floor((duration - Math.floor(duration / 3600) * 3600) / 60) * 60
      let minutes = Math.floor((duration - Math.floor(duration / 3600) * 3600) / 60)
      let hours = Math.floor(duration / 3600)
      if (hours > 0) {
        if (minutes > 0) {
          if (seconds > 29) {
            return singular_plural(hours, 'hour') + ' ' + singular_plural(minutes + 1, 'minute')
          } else return singular_plural(hours, 'hour') + ' ' + singular_plural(minutes, 'minute')
        } else return singular_plural(hours, 'hour')
      } else if (minutes > 0) {
        if (seconds > 29) return singular_plural(minutes + 1, 'minute')
        else return singular_plural(minutes, 'minute')
      } else if (seconds >= 0) return singular_plural(seconds, 'second')
    }
  }
}

function formatDistance(distance) {
  if (typeof distance !== 'number') return new Error('Please provide a number')
  else if (distance < 0) return new Error('Please provide a positive distance')
  else {
    let kilometers = distance / 1000
    if (kilometers > 1) return kilometers + ' km'
    else return singular_plural(distance, 'meter')
  }
}

function singular_plural(number, unit) {
  if (number >= 0 && number <= 1) return number + ' ' + unit
  else if (number > 1) return number + ' ' + unit + 's'
}
