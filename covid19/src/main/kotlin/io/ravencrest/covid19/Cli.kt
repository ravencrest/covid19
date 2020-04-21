package io.ravencrest.covid19

import com.fasterxml.jackson.databind.MappingIterator
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.dataformat.csv.CsvMapper
import com.fasterxml.jackson.dataformat.csv.CsvParser
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ravencrest.covid19.model.RawTimeSeries
import io.ravencrest.covid19.model.TimeSeries
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.FileOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.time.LocalDate
import java.time.format.DateTimeFormatterBuilder
import kotlin.system.exitProcess

const val NORMALIZER = 100_000
const val WHO_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/who_covid_19_situation_reports/who_covid_19_sit_rep_time_series/who_covid_19_sit_rep_time_series.csv"
const val CSSE_GLOBAL_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
const val CSSE_US_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv"

val timeSeriesPath: Path = Paths.get("./timeseries.csv").toAbsolutePath()

// Population data is manually scraped from https://www.worldometers.info/world-population/population-by-country/ It'd be nice to find a better source
val populationPath: Path = Paths.get("./population.csv").toAbsolutePath()

// Manually generated list that maps the country labels in the population data to the COVID-19 time series country labels
val countriesPath: Path = Paths.get("./countries.csv").toAbsolutePath()

// Manually generated list that maps territories to their sovereign state
val territoriesPath: Path = Paths.get("./territories.csv").toAbsolutePath()

// Manually generated list for data we don't want to io.ravencrest.covid19.parse
val blacklistPath: Path = Paths.get("./blacklist.txt").toAbsolutePath()

fun loadCountries(): Map<String, String> {
  val map = mutableMapOf<String, String>()
  readCsvToStringArray(countriesPath).forEach {
    val normalizedValue = it[0]
    for (i in 1 until it.size) {
      val key = it[i]
      map[key] = normalizedValue
    }
  }
  return map.toMap()
}

// Originally, we used POJOs, but string arrays allows us to re-use code and simplifies a few things
fun readCsvToStringArray(path: Path): MappingIterator<Array<String>> {
  val csvMapper = CsvMapper()
  csvMapper.enable(CsvParser.Feature.WRAP_AS_ARRAY)
  val bufferedReader = Files.newBufferedReader(path)
  return csvMapper.readerFor(Array<String>::class.java).readValues(bufferedReader)
}

fun loadPopulations(countries: Map<String, String>): Map<String, Long> {
  val csvIterator =
    readCsvToStringArray(populationPath)
  return csvIterator.asSequence().associateBy({ row -> row[0] }, { row -> row[1].toLong() }).toMutableMap()
    .let { populations ->
      // Combine territory populations with their sovereign state population
      countries.forEach { (rawState, normalizedState) ->
        // Look up the territory and state names and map them to the appropriate key for the population data
        val normalizedPop = populations[normalizedState] ?: 0
        val rawPop = populations[rawState] ?: 0

        val population = normalizedPop + rawPop
        populations.remove(normalizedState)
        populations.remove(rawState)
        populations[normalizedState] = population
      }
      populations.toMap()
    }
}

fun loadBlacklist(): Set<String> {
  return Files.newBufferedReader(blacklistPath).readLines().toSet()
}

fun loadTimeSeries(url: String): MappingIterator<Array<String>> {
  val timeSeriesFile = timeSeriesPath.toFile()
  if (!timeSeriesFile.exists()) {
    try {
      println("Fetching data from GitHub...")
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
  // We're not  doing anything with header data yet. This will be used for graphing the data
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

fun main() {
  val jsonMapper = ObjectMapper()
    .registerModule(JavaTimeModule())
    .registerModule(KotlinModule())
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
  val rawData = parseCsse()
  val sortedSeries = rawData.mapIndexed { index, it -> it.last(index) }.sortedWith(compareByDescending { v -> v?.normalizedValue }).mapIndexed { index, point -> point?.copy(rank = index) }
  val path = Paths.get("./results.json").toAbsolutePath()
  val exportBytes = jsonMapper.writeValueAsString(sortedSeries)
  Files.write(path, exportBytes.toByteArray())
}