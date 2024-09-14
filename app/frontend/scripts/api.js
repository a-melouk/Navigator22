const baseURI = 'https://navigator-22-production.up.railway.app/'
// const baseURI = 'http://localhost:4000/'

//-------------------------------GET METHODS-------------------------------//
async function getRelatedSegmentDb(want, id) {
  let uri = baseURI + 'segment/'
  if (want === 'from') uri += 'to?id=' + id
  if (want === 'to') uri += 'from?id=' + id

  const response = await fetch(uri)
  const data = await response.json()
  if (typeof data.from !== 'undefined') return data
}

async function getSegmentHavingFromToDb(line, fromID, toID) {
  let uri = baseURI + 'lines/' + line + '?from=' + fromID + '&to=' + toID
  const response = await fetch(uri)
  const data = await response.json()
  if (typeof data.from !== 'undefined') return data
}

async function getLineByNameDb(line) {
  const uri = baseURI + 'lines?name=' + line
  const response = await fetch(uri)
  let data = await response.json()
  return data
}

async function getStationsFrom_StationsDb(line) {
  const response = await fetch(baseURI + 'stations/' + line)
  let data = await response.json()
  return data
}

//Get stations from Lines collection
async function getStationsFrom_LinesDb(line) {
  const response = await fetch(baseURI + 'lines/' + line + '/stations')
  let data = await response.json()
  return data
}

async function getAllLinesNamesIdsDb() {
  const response = await fetch(baseURI + 'lines/all')
  let data = await response.json()
  return data
}

async function getAllSegmentLineDb(line) {
  const response = await fetch(baseURI + 'schedule/' + line)
  let data = await response.json()
  return data
}

async function getRoute(from, to, mean) {
  const response = await fetch(baseURI + 'shortest-path?from=' + from + '&to=' + to + '&mean=' + mean)
  const data = await response.json()
  return data
}

//-------------------------------POST METHODS------------------------------//
async function postStationDb(station) {
  try {
    const response = await fetch(baseURI + 'stations', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(station),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}

async function postLineDb(line) {
  try {
    const response = await fetch(baseURI + 'lines', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(line),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}

//------------------------------UPDATE METHODS------------------------------//
async function deleteStationByIdDb(id) {
  try {
    const response = await fetch(baseURI + 'stations/' + id, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}

async function deleteSegmentIdDb(lineID, segmentID) {
  try {
    const response = await fetch(baseURI + 'segment/' + lineID + '/' + segmentID, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}

async function deleteSegmentByStationIdDb(id) {
  try {
    const response = await fetch(baseURI + 'lines/' + JSON.parse(lineElement.value)._id + '/station/' + id, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}

async function deleteLineDb() {
  try {
    const response = await fetch(baseURI + 'line/' + JSON.parse(lineElement.value).name, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    lineElement.value = ''
    populate()
    return data
  } catch (err) {
    return err
  }
}

async function patchStationDb(id, body) {
  try {
    const response = await fetch(baseURI + 'station?id=' + id, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}

async function patchSegmentDb(id, body) {
  try {
    // /lines/:line/segment/:segmentId
    const response = await fetch(baseURI + 'segment?id=' + id, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}

async function patchSegmentDurationDb(id, body) {
  try {
    const response = await fetch(baseURI + 'duration?id=' + id, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}

async function patchLineDb(lineID, body) {
  try {
    const response = await fetch(baseURI + 'line?id=' + lineID, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return err
  }
}
//-------------------------------------------------------------------------//
