package io.ravencrest.covid19.parse

import com.fasterxml.jackson.databind.MappingIterator
import io.ravencrest.covid19.model.Point
import io.ravencrest.covid19.model.TimeSeries
import io.ravencrest.covid19.startDate
import java.time.LocalDate
import java.time.format.DateTimeFormatterBuilder

//const val CTP_US_URL = "https://covidtracking.com/api/v1/us/daily.csv"
const val CTP_US_URL = "https://covidtracking.com/api/v1/states/daily.csv"

fun parseCtp(csvIterator: MappingIterator<Array<String>>, countries: Map<String, String>, startDate: LocalDate): List<TimeSeries> {
  val blacklist = loadBlacklist()

  val parser = DateTimeFormatterBuilder()
    .appendPattern("yyyyMMdd")
    .toFormatter()
  val headers = csvIterator.next().toList()
  val countIndex = headers.indexOf("totalTestResults")
  val countryCodeIndex = headers.indexOf("state")
  val dateIndex = headers.indexOf("date")
  val stateCodesToNames = countries.entries.associateBy({e -> e.value}, {e -> e.key})
  val dataMap = mutableMapOf<String, MutableList<Point>>()
  while (csvIterator.hasNext()) {
    val row = csvIterator.next()
    val country = row[countryCodeIndex].let {
      stateCodesToNames[it] ?: it
    }
    if (blacklist.contains(country)) {
      continue
    }
    // Sometimes, the last entry is a float even though everything else is a long. If we parse it as a long first, we may end up missing the last row
    val value = row[countIndex].toLongOrNull() ?: 0
    val date = LocalDate.parse(row[dateIndex], parser)
    dataMap.getOrPut(country) { mutableListOf() }.add(Point(value = value, date = date))
  }

  val sortedSeries = dataMap.map { (k, v) ->
    val byDate = v.associateBy { it.date }.toSortedMap()
    var prevEntry = byDate[byDate.firstKey()]!!
    val last = byDate.lastKey()!!
    var key = startDate
    while (key <= last) {
      var entry = byDate[key]
      if (entry == null) {
        entry = prevEntry.copy(date = key)
        byDate[key] = entry
      }
      prevEntry = entry
      key = key.plusDays(1)
    }
    TimeSeries(
      label = "testing",
      region = k,
      points = byDate.values.toList()
    )
  }

  dataMap.clear()
  return sortedSeries
}

fun parseCtpUS(countries: Map<String, String>, startDate: LocalDate): List<TimeSeries> {
  return parseCtp(loadTimeSeries("ctp_us", CTP_US_URL), countries, startDate)
}

fun main() {
  parseCtpUS(loadUsRegions(), startDate = startDate)
}