package io.ravencrest.covid19.parse

import com.fasterxml.jackson.databind.MappingIterator
import io.ravencrest.covid19.model.RawTimeSeries
import io.ravencrest.covid19.model.TimeSeries
import java.io.FileOutputStream
import java.net.SocketTimeoutException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatterBuilder
import kotlin.system.exitProcess
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.Request

const val WHO_CASES_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/who_covid_19_situation_reports/who_covid_19_sit_rep_time_series/who_covid_19_sit_rep_time_series.csv"
const val CSSE_CASES_GLOBAL_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
const val CSSE_CASES_US_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv"
const val CSSE_DEATHS_US_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv"
const val CSSE_DEATHS_GLOBAL_URL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv"
const val CSSE_RECOVERED_GLOBAL_URL = "https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv"

val baseTimeSeriesPath: Path = Paths.get(if (isDev) "tmp" else ".").toAbsolutePath()

fun loadTimeSeries(name: String, url: String): MappingIterator<Array<String>> {
  @Suppress("NAME_SHADOWING")
  val url = url.toHttpUrlOrNull()!!
  val ingestDataPath = baseTimeSeriesPath.resolve("$name.csv").toAbsolutePath()
  val ingestDataFile = ingestDataPath.toFile()
  val purgeIfOlder = LocalDateTime.now().toInstant(ZoneOffset.UTC) - Duration.ofHours(8)
  if (ingestDataFile.exists() && ingestDataFile.lastModified() > purgeIfOlder.toEpochMilli()) {
    println("Recent $name data already exists on disk. Using that to generate results.")
    println("If you'd like fresh data, delete $ingestDataPath and run the tool again.\n")
  } else {
    deleteStaleData(ingestDataPath)
    try {
      println("Fetching $name data from $url")
      Files.createDirectories(ingestDataPath.parent)
      val client = OkHttpClient()
      val request = Request.Builder().url(url).get().build()

      client.newCall(request).execute().use {
        val body = it.body ?: return@use
        FileOutputStream(ingestDataFile).use { writer ->
          body.byteStream().copyTo(writer)
        }
      }
    } catch (ste: SocketTimeoutException) {
      println("Connecting to ${url.host} timed out. Please try later. Exiting.")
      exitProcess(1)
    } catch (e: Exception) {
      println("Failed to retrieve data from ${url.host}. Exiting.")
      e.printStackTrace()
      exitProcess(1)
    }
  }
  return readCsvToStringArray(ingestDataPath)
}

fun parse(csvIterator: MappingIterator<Array<String>>, countryOffSet: Int, timeSeriesOffset: Int, countries: Map<String, String>): List<TimeSeries> {
  val blacklist = loadBlacklist()

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
    val newSeries = row.slice(timeSeriesOffset until row.size).map { it.toLongOrNull() }
    val previousSeries = dataMap[country]?.points

    // Some countries are broken up into multiple rows, we want to merge the previously parsed rows with the most recently parsed row
    val mergedSeries = previousSeries?.mapIndexed { index, oldValue ->
      val newValue = (if (index < newSeries.size) newSeries[index] else null) ?: 0L
      (oldValue ?: 0) + newValue
    } ?: newSeries

    val newRow = RawTimeSeries(
      region = country,
      points = mergedSeries
    )
    dataMap[country] = newRow
  }

  val sortedSeries = dataMap.values.map { it.toTimeSeries(headers) }
  dataMap.clear()
  return sortedSeries
}

fun parseWho(countries: Map<String, String>): List<TimeSeries> {
  return parse(loadTimeSeries("who_cases", WHO_CASES_URL), 1, 3, countries)
}

fun parseCsseCasesGlobal(countries: Map<String, String>): List<TimeSeries> {
  return parse(loadTimeSeries("csse_cases", CSSE_CASES_GLOBAL_URL), 1, 4, countries)
}

fun parseCsseDeathsGlobal(countries: Map<String, String>): List<TimeSeries> {
  return parse(loadTimeSeries("csse_deaths", CSSE_DEATHS_GLOBAL_URL), 1, 4, countries)
}

fun parseCsseRecoveredGlobal(countries: Map<String, String>): List<TimeSeries> {
  return parse(loadTimeSeries("csse_recovered", CSSE_RECOVERED_GLOBAL_URL), 1, 4, countries)
}

fun parseCsseCasesUS(countries: Map<String, String>): List<TimeSeries> {
  return parse(loadTimeSeries("csse_cases_us", CSSE_CASES_US_URL), 6, 11, countries)
}

fun parseCsseDeathsUS(countries: Map<String, String>): List<TimeSeries> {
  return parse(loadTimeSeries("csse_deaths_us", CSSE_DEATHS_US_URL), 6, 12, countries)
}
