package io.ravencrest.covid19

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ravencrest.covid19.model.Results
import io.ravencrest.covid19.model.TableRow
import io.ravencrest.covid19.model.TimeSeries
import io.ravencrest.covid19.parse.*
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneOffset

typealias TimeSeriesParser = (countries: Map<String, String>) -> Set<TimeSeries>

fun parseGlobal(countries: () -> Map<String, String>, populationIndex: Map<String, Long>, parseConfirmed: TimeSeriesParser, parseDeaths: TimeSeriesParser, parseRecovered: TimeSeriesParser?): Results {
  val countriesIndex = countries()
  val rawCases = parseConfirmed(countriesIndex).associateBy { it.region }
  val deathsIndex = parseDeaths(countriesIndex).associateBy { it.region }
  val recoveredIndex = parseRecovered?.let { it(countriesIndex) }?.associateBy { it.region } ?: emptyMap()
  val startDate = LocalDate.of(2020, 3, 17)

  val sortedCases = rawCases.values.mapNotNull { series ->
    val country = series.region
    series.last()?.let { point ->
      val latestValue = point.value
      val secondToLast = series.secondToLast()
      val change =
        secondToLast?.value?.let { previousValue -> (latestValue - previousValue) / previousValue.toDouble() }?.takeUnless { it.isNaN() }

      //val change = normalize(secondToLast?.value?.let { previousValue -> (latestValue - previousValue) / previousValue.toDouble()}?: 0.0, populationIndex[series.country]!!)

      val population = populationIndex[country] ?: error("Missing population data for $country")
      val deaths = deathsIndex[country]?.last()?.value ?: 0
      val recovered = recoveredIndex[country]?.last()?.value

      val pointList = series.points.filter { point -> point.value > 0 }.filter { point -> point.date > startDate }
        .sortedBy { point -> point.date }
      val points = pointList.sortedBy { p -> p.date }
        .mapIndexedNotNull { index, point ->
          val previous = if (index == 0) null else pointList[index - 1]
          val previousValue = previous?.value ?: point.value
          val change = normalize(point.value - previousValue, population)
          if (change == 0L) {
            return@mapIndexedNotNull null
          }
          point.copy(value = change)
        }

      TableRow(
        region = country,
        cases = latestValue,
        casesNormalized = normalize(latestValue, population),
        change = change,
        deaths = deaths,
        deathsNormalized = normalize(deaths, population),
        recovered = recovered,
        recoveredNormalized = recovered?.let {normalize(it, population)},
        population = population,
        changeNormalizedSeries = series.copy(points = points)
      )
    }
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

  val path = Paths.get(if (isDev) "./ui/src" else ".", "${filename}.json").toAbsolutePath()
  deleteStaleData(path)
  val exportBytes = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(results)
  Files.write(path, exportBytes.toByteArray())
  println("Results exported to $path")
}

fun main() {
  val countries = loadCountries()
  val globalResults = parseGlobal(::loadCountries, loadGlobalPopulations(countries), ::parseCsseCasesGlobal, ::parseCsseDeathsGlobal, ::parseCsseRecoveredGlobal)
  val usResults = parseGlobal({ emptyMap() }, loadUsPopulations(), ::parseCsseCasesUS, ::parseCsseDeathsUS, null)

  writeResults("results_us", usResults)
  writeResults("results_global", globalResults)

}