package io.ravencrest.covid19

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ravencrest.covid19.model.Point
import io.ravencrest.covid19.model.Results
import io.ravencrest.covid19.model.TableRow
import io.ravencrest.covid19.model.TimeSeries
import io.ravencrest.covid19.parse.deleteStaleData
import io.ravencrest.covid19.parse.isDev
import io.ravencrest.covid19.parse.loadCountries
import io.ravencrest.covid19.parse.loadGlobalPopulations
import io.ravencrest.covid19.parse.loadUsPopulations
import io.ravencrest.covid19.parse.normalize
import io.ravencrest.covid19.parse.parseCsseCasesGlobal
import io.ravencrest.covid19.parse.parseCsseCasesUS
import io.ravencrest.covid19.parse.parseCsseDeathsGlobal
import io.ravencrest.covid19.parse.parseCsseDeathsUS
import io.ravencrest.covid19.parse.parseCsseRecoveredGlobal
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneOffset

typealias TimeSeriesParser = (countries: Map<String, String>) -> List<TimeSeries>

fun parseGlobal(
  countries: () -> Map<String, String>,
  populationIndex: Map<String, Long>,
  parseConfirmed: TimeSeriesParser,
  parseDeaths: TimeSeriesParser,
  parseRecovered: TimeSeriesParser?
): Results {
  val countriesIndex = countries()
  val rawCases = parseConfirmed(countriesIndex).associateBy { it.region }
  val deathsIndex = parseDeaths(countriesIndex).associateBy { it.region }
  val recoveredIndex = parseRecovered?.let { it(countriesIndex) }?.associateBy { it.region } ?: emptyMap()
  val startDate = LocalDate.of(2020, 3, 17)

  val sevenDaysAgo = LocalDate.now().minusWeeks(1)
  val fourteenDaysAgo = LocalDate.now().minusWeeks(2)

  val sortedCases = rawCases.values.map { series ->
    val country = series.region

    val thisWeek = series.points.filter { point -> point.date >= sevenDaysAgo }
    val lastWeek = series.points.filter { point -> point.date >= fourteenDaysAgo && point.date < sevenDaysAgo }

    val twa = thisWeek.map { it.value }.average()
    val lwa = lastWeek.map { it.value }.average()
    val weeklyChange = ((twa - lwa) / lwa.toDouble()).takeUnless { it.isInfinite() || it.isNaN() }

    val newCases = series.points.mapIndexed { index, point ->
      val previous = if (index == 0) 0L else series.points[index - 1].value
      point.copy(value = point.value - previous)
    }

    val totalCases = series.last()?.value ?: 0L
    val newCases0 = newCases.last().value
    val newCases1 = newCases[newCases.size - 2].value
    val changePercent =
      if (newCases0 == newCases1 || newCases1 == 0L) 0.0 else ((newCases0 - newCases1) / newCases1.toDouble())

    val population = populationIndex[country] ?: error("Missing population data for $country")
    val deaths = deathsIndex[country]?.last()?.value ?: 0
    val recovered = recoveredIndex[country]?.last()?.value

    val pointList = series.points.filter { point -> point.value > 0 }.filter { point -> point.date > startDate }
      .sortedBy { point -> point.date }

    val changeSet = pointList.mapIndexedNotNull { index, point ->
      val previous = if (index == 0) null else pointList[index - 1]
      val previousValue = previous?.value ?: point.value
      Triple(point.date, point.value, previousValue)
    }

    val changeSeries = changeSet.map { point ->
      val date = point.first
      val value = point.second
      val previous = point.third
      val dailyChange = value - previous

      Point(date = date, value = dailyChange)
    }

    val normalizedChangeSeries = changeSeries.map { point ->
      point.copy(value = normalize(point.value, population))
    }

    TableRow(
      region = country,
      cases = totalCases,
      casesNormalized = normalize(totalCases, population),
      change = changePercent,
      weeklyChange = weeklyChange,
      deaths = deaths,
      deathsNormalized = normalize(deaths, population),
      recovered = recovered,
      recoveredNormalized = recovered?.let { normalize(it, population) },
      population = population,
      changeNormalizedSeries = series.copy(points = normalizedChangeSeries),
      changeSeries = series.copy(points = changeSeries)
    )
  }.sortedWith(compareByDescending { v -> v.casesNormalized })

  return Results(
    lastUpdated = OffsetDateTime.now(ZoneOffset.UTC),
    rows = sortedCases
  )
}

fun writeResults(filename: String, results: Results) {
  val jsonMapper = ObjectMapper()
    .registerModule(JavaTimeModule())
    .registerModule(KotlinModule())
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
    .setSerializationInclusion(JsonInclude.Include.NON_NULL)

  val path = Paths.get(if (isDev) "./ui/src" else ".", "$filename.json").toAbsolutePath()
  deleteStaleData(path)
  val exportBytes = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(results)
  Files.write(path, exportBytes.toByteArray())
  println("Results exported to $path")
}

fun main() {
  val countries = loadCountries()
  val globalResults = parseGlobal(
    ::loadCountries,
    loadGlobalPopulations(countries),
    ::parseCsseCasesGlobal,
    ::parseCsseDeathsGlobal,
    ::parseCsseRecoveredGlobal
  )
  val usResults = parseGlobal({ emptyMap() }, loadUsPopulations(), ::parseCsseCasesUS, ::parseCsseDeathsUS, null)

  writeResults("results_us", usResults)
  writeResults("results_global", globalResults)
}
