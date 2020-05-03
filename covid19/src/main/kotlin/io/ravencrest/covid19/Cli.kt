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
import io.ravencrest.covid19.parse.loadStates
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


fun buildChangeSeries(rawCases: Map<String, TimeSeries>): Map<String, TimeSeries> {
  return rawCases.values.map { series ->
    val region = series.region
    val points = series.points.sortedBy { it.date }.filterNot { it.value == 0L }
    val filteredPoints = filterBadDataPoints(points)

    val newCases = filteredPoints.mapIndexed { index, point ->
      val previous = if (index == 0) 0L else filteredPoints[index - 1].value
      if (previous > point.value) {
        error("$region ${point.value} ${previous} ${point.date}")
      }
      point.copy(value = point.value - previous)
    }
    series.copy(points = newCases)
  }.associateBy { it.region }
}

fun normalizeChangeSeries(series: TimeSeries, population: Long): TimeSeries {
  return series.copy(points = series.points.map { point ->
    try { point.copy(value = normalize(point.value, population)) } catch (e: Exception) {
      println("failed to normalize ${series.region}")
      throw e
    }
  })
}

fun filterBadDataPoints(rawPoints: List<Point>): List<Point> {
  val startDate = LocalDate.of(2020, 3, 17)

  var prev: Point? = null
  val points = rawPoints.sortedBy { it.date }.filterNot { it.value == 0L }
  var filteredPoints = mutableListOf<Point>()
  for (point in points) {
    if (prev != null) {
      if(prev.value <= point.value) {
        filteredPoints.add(point)
        prev = point

      }
    } else {
      prev = point
    }
  }
  return filteredPoints.filter { point -> point.date > startDate && point.value > 0L }
}

fun parseGlobal(
  countryCodeIndex: Map<String, String>,
  populationIndex: Map<String, Long>,
  rawCases: Map<String, TimeSeries>,
  deathsIndex: Map<String, TimeSeries>,
  recoveredIndex: Map<String, TimeSeries>
): Results {

  val sevenDaysAgo = LocalDate.now().minusWeeks(1)
  val fourteenDaysAgo = LocalDate.now().minusWeeks(2)

  val sortedCases = rawCases.values.map { series ->
    val region = series.region
    val regionCode = countryCodeIndex[region] ?: error("No region code found for $region")
    val filteredPoints =  filterBadDataPoints(series.points.sortedBy { it.date }.filterNot { it.value == 0L })

    val thisWeek = filteredPoints.filter { point -> point.date >= sevenDaysAgo }
    val lastWeek = filteredPoints.filter { point -> point.date >= fourteenDaysAgo && point.date < sevenDaysAgo }

    val twa = thisWeek.map { it.value }.average()
    val lwa = lastWeek.map { it.value }.average()
    val weeklyChange = ((twa - lwa) / lwa).takeUnless { it.isInfinite() || it.isNaN() }

    val newCases = filteredPoints.mapIndexed { index, point ->
      val previous = if (index == 0) 0L else filteredPoints[index - 1].value
      if (previous > point.value) {
        error("$region ${point.value} $previous ${point.date}")
      }
      point.copy(value = point.value - previous)
    }

    val totalCases = series.last()?.value ?: 0L
    val newCases0 = if (newCases.size > 2) newCases[newCases.size - 1].value else 0L
    val newCases1 = if (newCases.size > 2) newCases[newCases.size - 2].value else 0L
    val changePercent =
      if (newCases0 == newCases1 || newCases1 == 0L) 0.0 else ((newCases0 - newCases1) / newCases1.toDouble())

    val population = populationIndex[region] ?: error("Missing population data for $region")
    val deaths = deathsIndex[region]?.last()?.value ?: 0
    val recovered = recoveredIndex[region]?.last()?.value


    TableRow(
      region = region,
      code = regionCode,
      cases = totalCases,
      casesNormalized = normalize(totalCases, population),
      change = changePercent,
      weeklyChange = weeklyChange,
      deaths = deaths,
      deathsNormalized = normalize(deaths, population),
      recovered = recovered,
      recoveredNormalized = recovered?.let { normalize(it, population) },
      population = population
    )
  }.sortedWith(compareByDescending { v -> v.casesNormalized })

  return Results(
    lastUpdated = OffsetDateTime.now(ZoneOffset.UTC),
    rows = sortedCases
  )
}

fun writeResults(filename: String, results: Any) {
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
  val (countriesIndex, codes) = loadCountries()
  val globalPop = loadGlobalPopulations(countriesIndex)
  val recoveredIndex = parseCsseRecoveredGlobal(countriesIndex).associateBy { it.region }
  val globalCases = parseCsseCasesGlobal(countriesIndex).associateBy { it.region }
  val globalDeaths = parseCsseDeathsGlobal(countriesIndex).associateBy { it.region }

  val globalCasesSeries = buildChangeSeries(globalCases)
  val globalDeathsSeries = buildChangeSeries(globalDeaths)

  val globalCasesNormalizedSeries = globalCasesSeries.mapValues{ (k, v) ->
    normalizeChangeSeries(v, globalPop[v.region] ?: error("Missing population for ${v.region}"))
  }
  val globalDeathNormalizedSeries = globalDeathsSeries.mapValues{ (k, v) ->
    normalizeChangeSeries(v, globalPop[v.region] ?: error("Missing population for ${v.region}"))
  }

  val globalResults = parseGlobal(
    codes,
    globalPop,
    globalCases,
    globalDeaths,
    recoveredIndex
  )

  writeResults("results_global", globalResults)
  writeResults("results_global_cases_normalized", globalCasesNormalizedSeries)
  writeResults("results_global_cases", globalCasesSeries)
  writeResults("results_global_deaths_normalized", globalDeathNormalizedSeries)
  writeResults("results_global_deaths", globalDeathsSeries)



  val usPop =  loadUsPopulations()
  val states = loadStates()
  val usCases = parseCsseCasesUS(emptyMap()).associateBy { it.region }
  val usDeaths = parseCsseDeathsUS(emptyMap()).associateBy { it.region }
  val usResults = parseGlobal(states, usPop, usCases, usDeaths, emptyMap())

  val usCasesNormalizedSeries = usCases.mapValues{ (k, v) ->
    normalizeChangeSeries(v, usPop[v.region] ?: error("Missing population for ${v.region}"))
  }
  val usDeathNormalizedSeries = usDeaths.mapValues{ (k, v) ->
    normalizeChangeSeries(v, usPop[v.region] ?: error("Missing population for ${v.region}"))
  }

  writeResults("results_us", usResults)
  writeResults("results_us_cases_normalized", usCasesNormalizedSeries)
  writeResults("results_us_cases", usCases)
  writeResults("results_us_deaths_normalized", usDeathNormalizedSeries)
  writeResults("results_us_deaths", usDeaths)
}
