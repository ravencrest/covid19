package io.ravencrest.covid19.parse

import com.fasterxml.jackson.databind.MappingIterator
import io.ravencrest.covid19.model.RawTimeSeries
import io.ravencrest.covid19.model.TimeSeries
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.FileOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.time.*
import java.time.format.DateTimeFormatterBuilder
import kotlin.system.exitProcess

const val WHO_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/who_covid_19_situation_reports/who_covid_19_sit_rep_time_series/who_covid_19_sit_rep_time_series.csv"
const val CSSE_GLOBAL_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
const val CSSE_US_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv"

val timeSeriesPath: Path = Paths.get(if (isDev) "tmp" else ".","timeseries.csv").toAbsolutePath()

fun loadTimeSeries(url: String): MappingIterator<Array<String>> {
  val timeSeriesFile = timeSeriesPath.toFile()
  val purgeIfOlder = LocalDateTime.now().toInstant(ZoneOffset.UTC) - Duration.ofHours(8)
  if (timeSeriesFile.exists() && timeSeriesFile.lastModified() > purgeIfOlder.toEpochMilli()) {
      println("Recent timeseries data already exists on disk. Using that to generate results.")
      println("If you'd like fresh data, delete $timeSeriesPath and run the tool again.")
  }
  else {
    deleteStaleData(timeSeriesPath)
    try {
      println("Fetching data from GitHub...")
      Files.createDirectories(timeSeriesPath.parent)
      val client = OkHttpClient()
      val request = Request.Builder().url(url).get().build()

      client.newCall(request).execute().use {
        val body = it.body ?: return@use
        FileOutputStream(timeSeriesFile).use { writer ->
          body.byteStream().copyTo(writer)
        }
      }
    } catch (e: Exception) {
      println("Failed to load data from GitHub. Exiting.")
      e.printStackTrace()
      exitProcess(1)
    }
  }
  return readCsvToStringArray(timeSeriesPath)
}

fun parse(url: String, countryOffSet: Int, timeSeriesOffset: Int): Set<TimeSeries> {
  val blacklist = loadBlacklist()
  val countries = loadCountries()
  val populations = loadPopulations(countries = countries)

  val csvIterator = loadTimeSeries(url)
  val parser = DateTimeFormatterBuilder()
    .appendPattern("M/d/y")
    .toFormatter()
  val headers = csvIterator.next().let { it.slice(timeSeriesOffset until it.size) }
    .map { LocalDate.parse(it, parser).plusYears(2000) }

  val dataMap = mutableMapOf<String, RawTimeSeries>()
  while (csvIterator.hasNext()) {
    val row = csvIterator.next()
    val country = row[countryOffSet].let {
      countries[it] ?: it
    }
    if (blacklist.contains(country)) {
      continue
    }
    val popCountry = countries[country] ?: country
    val population = populations[popCountry]
    if (population == null) {
      println("Failed to find an appropriate country for $country. Most likely, we're missing a mapping `countries.csv`.")
      continue
    }
    val newSeries = row.slice(timeSeriesOffset until row.size).map { it.toDoubleOrNull() }
    val previousSeries = dataMap[country]?.points

    // Some countries are broken up into multiple rows, we want to merge the previously parsed rows with the most recently parsed row
    val mergedSeries = previousSeries?.mapIndexed { index, oldValue ->
      val newValue = newSeries[index] ?: 0.0
      (oldValue ?: 0.0) + newValue
    } ?: newSeries

    val newRow = RawTimeSeries(
      country = country,
      points = mergedSeries,
      population = population
    )
    dataMap[country] = newRow
  }

  val sortedSeries = dataMap.values.map { it.toTimeSeries(headers) }.toSet()
  dataMap.clear()
  return sortedSeries
}

fun parseWho(): Set<TimeSeries> {
  return parse(WHO_URL, 1, 3)
}

fun parseCsse(): Set<TimeSeries> {
  return parse(CSSE_GLOBAL_URL, 1, 4)
}