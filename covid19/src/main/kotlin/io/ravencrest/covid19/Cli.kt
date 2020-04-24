package io.ravencrest.covid19

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ravencrest.covid19.model.Results
import io.ravencrest.covid19.model.TableRow
import io.ravencrest.covid19.parse.*
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneOffset
import kotlin.math.roundToLong

fun main() {
  val jsonMapper = ObjectMapper()
    .registerModule(JavaTimeModule())
    .registerModule(KotlinModule())
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)

  val countriesIndex = loadCountries()
  val populationIndex = loadPopulations(countriesIndex)

  val rawCases = parseCsseCases(countriesIndex).associateBy { it.country }
  val deathsIndex = parseCsseDeaths(countriesIndex).associateBy { it.country }
  val recoveredIndex = parseCsseRecovered(countriesIndex).associateBy { it.country }

  val sortedCases = rawCases.values.mapNotNull { series ->
    series.last()?.let { point ->
      val latestValue = point.value
      val secondToLast = series.secondToLast()
      val change = secondToLast?.value?.let { previousValue -> (latestValue - previousValue) / previousValue.toDouble()}
      //val change = normalize(secondToLast?.value?.let { previousValue -> (latestValue - previousValue) / previousValue.toDouble()}?: 0.0, populationIndex[series.country]!!)

      val country = point.country
      val population = populationIndex[country] ?: error("Missing population data for $country")
      val deaths = deathsIndex[country]?.last()?.value ?: 0
      val recovered = recoveredIndex[country]?.last()?.value ?: 0

      TableRow(
        region = country,
        cases = latestValue,
        casesNormalized = normalize(latestValue, population),
        change = change,
        deaths = deaths,
        deathsNormalized = normalize(deaths, population),
        recovered = recovered,
        recoveredNormalized = normalize(recovered, population),
        population = population
      )
    }
  }
    .sortedWith(compareByDescending { v -> v.casesNormalized })

  val startDate = LocalDate.of(2020,3, 17)
  val indexOfUs = sortedCases.indexOfFirst { case -> case.region == "United States" }
  val countriesToGraph = sortedCases.slice(0..indexOfUs).mapNotNull {
    val case = rawCases[it.region]
    assert(case!!.country == it.region)
    case
  }.filter { case -> populationIndex.getOrDefault(case.country, 0) > 10_000_000}

  /*val growthRate = countriesToGraph.map { series ->
    val pointList = series.points.filter { point -> point.value > 0}.toList()
    val subpoints = pointList.filter { point -> point.value > 0}.filter { point -> point.date > LocalDate.now().minusWeeks(2)}.sortedBy { point -> point.date }
      val points = subpoints.mapIndexedNotNull { index, point ->
        val previous = if (index == 0) null else subpoints[index - 1]
        val previousValue = previous?.value ?: point.value

        val change = ((point.value - previousValue) / previousValue.toDouble() * 1000).roundToLong()
        if (point.country == "United States") {
          println("${point.value} $previousValue $change")
        }
        if (change == 0L) {
          return@mapIndexedNotNull null
        }
        point.copy(value = change)
      }
    series.copy(points = points)
  }*/

  val changeRate = countriesToGraph.map { series ->
    val pointList = series.points.filter { point -> point.value > 0}.filter { point -> point.date > startDate}.sortedBy { point -> point.date }
    val population = populationIndex[series.country] ?: error("No population data found for ${series.country}")
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
    series.copy(points = points)
  }

  val results =
    Results(
      lastUpdated = OffsetDateTime.now(ZoneOffset.UTC),
      rows = sortedCases,
      change = changeRate,
      growth = emptyList()
    )

  val path = Paths.get(if (isDev) "./ui/src" else ".", "results.json").toAbsolutePath()
  deleteStaleData(path)
  val exportBytes = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(results)
  Files.write(path, exportBytes.toByteArray())
  println("Results exported to $path")
}