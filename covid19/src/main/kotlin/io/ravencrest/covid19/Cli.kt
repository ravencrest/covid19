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
import io.ravencrest.covid19.parse.loadGlobalRegions
import io.ravencrest.covid19.parse.loadGlobalGdp
import io.ravencrest.covid19.parse.loadGlobalPopulations
import io.ravencrest.covid19.parse.loadUsRegions
import io.ravencrest.covid19.parse.loadUsGdp
import io.ravencrest.covid19.parse.loadUsPopulations
import io.ravencrest.covid19.parse.normalize
import io.ravencrest.covid19.parse.normalizeByPop
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
import kotlin.math.round

typealias TimeSeriesIndex = Map<String, TimeSeries>

val startDate = LocalDate.of(2020, 3, 17)!!

fun buildChangeSeries(rawCases: TimeSeriesIndex): TimeSeriesIndex {
  return rawCases.values.map { series ->
    val region = series.region
    val filteredPoints = filterBadDataPoints(series.points.sortedBy { it.date })

    val newCases = filteredPoints.mapIndexed { index, point ->
      val previous = if (index == 0) 0L else filteredPoints[index - 1].value
      if (previous > point.value) {
        error("$region ${point.value} $previous ${point.date}")
      }
      point.copy(value = point.value - previous)
    }
    series.copy(points = if (newCases.isNotEmpty()) newCases.subList(1, newCases.size) else newCases)
  }.associateBy { it.region }
}

fun filterBadDataPoints(rawPoints: List<Point>): List<Point> {
  var prev: Point? = null
  val points = rawPoints.sortedBy { it.date }.filter { point -> point.date > startDate }.filterNot { it.value == 0L }
  val filteredPoints = mutableListOf<Point>()
  for (point in points) {
    if (prev != null) {
      if (prev.value <= point.value) {
        filteredPoints.add(point)
        prev = point
      }
    } else {
      prev = point
    }
  }
  return filteredPoints
}

fun getChangePercent(current: Double, previous: Double): Long {
  return ((current - previous) / previous * 100).takeUnless { it.isInfinite() || it.isNaN() }?.let {round(it) }?.toLong() ?: 0L
}

fun getChangePercent(current: Long, previous: Long): Long {
  return if (current == previous || previous == 0L) 0 else round(((current - previous) / previous.toDouble() * 100)).toLong()
}

fun parseTableRows(
  countryCodeIndex: Map<String, String>,
  populationIndex: Map<String, Long>,
  gdpIndex: Map<String, Double>,
  rawCases: TimeSeriesIndex,
  deathsIndex: TimeSeriesIndex,
  recoveredIndex: TimeSeriesIndex
): Results {
  val sevenDaysAgo = LocalDate.now().minusWeeks(1)
  val fourteenDaysAgo = LocalDate.now().minusWeeks(2)

  val sortedCases = rawCases.values.map { series ->
    val region = series.region
    val regionCode = countryCodeIndex[region] ?: error("No region code found for $region")
    val filteredPoints = filterBadDataPoints(series.points.sortedBy { it.date })

    val thisWeek = filteredPoints.filter { point -> point.date >= sevenDaysAgo }
    val lastWeek = filteredPoints.filter { point -> point.date >= fourteenDaysAgo && point.date < sevenDaysAgo }

    val twa = thisWeek.map { it.value }.average()
    val lwa = lastWeek.map { it.value }.average()
    val weeklyChange = getChangePercent(twa, lwa)
    val newCases = rawCases[region]?.points ?: error("No region code found for $region")

    val totalCases = series.last()?.value ?: 0L
    val newCases0 = if (newCases.size > 2) newCases[newCases.size - 1].value else 0L
    val newCases1 = if (newCases.size > 2) newCases[newCases.size - 2].value else 0L
    val changePercent = getChangePercent(newCases0, newCases1)

    val population = populationIndex[region] ?: error("Missing population data for $region")
    val gdp = gdpIndex[region]
    val deaths = deathsIndex[region]?.last()?.value ?: 0
    val recovered = recoveredIndex[region]?.last()?.value

    TableRow(
      region = region,
      code = regionCode,
      cases = totalCases,
      casesNormalized = normalize(totalCases, population, gdp ?: 1.0),
      change = changePercent,
      weeklyChange = weeklyChange,
      deaths = deaths,
      recovered = recovered,
      population = population,
      gdp = gdp
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

fun parseResults(
  label: String,
  codes: Map<String, String>,
  population: Map<String, Long>,
  gdp: Map<String, Double>,
  recovered: List<TimeSeries>,
  cases: List<TimeSeries>,
  deaths: List<TimeSeries>
) {
  val recoveredIndex = recovered.associateBy { it.region }
  val cases = cases.associateBy { it.region }
  val deaths = deaths.associateBy { it.region }

  val casesSeries = buildChangeSeries(cases)
  val deathsSeries = buildChangeSeries(deaths)

  val globalResults = parseTableRows(
    codes,
    population,
    gdp,
    cases,
    deaths,
    recoveredIndex
  )

  writeResults("results_$label", globalResults)
  writeResults("results_${label}_cases", casesSeries)
  writeResults("results_${label}_deaths", deathsSeries)
}

fun main() {
  val (countriesIndex, codes) = loadGlobalRegions()
  val globalPop = loadGlobalPopulations(countriesIndex)
  val globalGdp = loadGlobalGdp(countriesIndex)
  val recoveredIndex = parseCsseRecoveredGlobal(countriesIndex)
  val globalCases = parseCsseCasesGlobal(countriesIndex)
  val globalDeaths = parseCsseDeathsGlobal(countriesIndex)
  parseResults(
    label = "global",
    cases = globalCases,
    codes = codes,
    deaths = globalDeaths,
    recovered = recoveredIndex,
    population = globalPop,
    gdp = globalGdp
  )

  val usPop = loadUsPopulations()
  val usGdp = loadUsGdp()
  val stateCodes = loadUsRegions()
  val usCases = parseCsseCasesUS(emptyMap())
  val usDeaths = parseCsseDeathsUS(emptyMap())
  parseResults(
    label = "us",
    cases = usCases,
    codes = stateCodes,
    deaths = usDeaths,
    recovered = emptyList(),
    population = usPop,
    gdp = usGdp
  )
}
