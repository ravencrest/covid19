package io.ravencrest.covid19

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ravencrest.covid19.model.Results
import io.ravencrest.covid19.model.TableRow
import io.ravencrest.covid19.model.TimeSeries
import io.ravencrest.covid19.parse.*
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneOffset
import kotlin.math.min
import kotlin.math.roundToLong

fun main() {
  val jsonMapper = ObjectMapper()
    .registerModule(JavaTimeModule())
    .registerModule(KotlinModule())
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
    .setSerializationInclusion(JsonInclude.Include.NON_NULL)

  val countriesIndex = loadCountries()
  val populationIndex = loadPopulations(countriesIndex)

  val rawCases = parseCsseCases(countriesIndex).associateBy { it.country }
  val deathsIndex = parseCsseDeaths(countriesIndex).associateBy { it.country }
  val recoveredIndex = parseCsseRecovered(countriesIndex).associateBy { it.country }
  val startDate = LocalDate.of(2020, 3, 17)

  val sortedCases = rawCases.values.mapNotNull { series ->
    series.last()?.let { point ->
      val latestValue = point.value
      val secondToLast = series.secondToLast()
      val change =
        secondToLast?.value?.let { previousValue -> (latestValue - previousValue) / previousValue.toDouble() }
      //val change = normalize(secondToLast?.value?.let { previousValue -> (latestValue - previousValue) / previousValue.toDouble()}?: 0.0, populationIndex[series.country]!!)

      val country = point.country
      val population = populationIndex[country] ?: error("Missing population data for $country")
      val deaths = deathsIndex[country]?.last()?.value ?: 0
      val recovered = recoveredIndex[country]?.last()?.value ?: 0

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
        recoveredNormalized = normalize(recovered, population),
        population = population,
        changeNormalizedSeries = series.copy(points = points)
      )
    }
  }.sortedWith(compareByDescending { v -> v.casesNormalized })

  val results =
    Results(
      lastUpdated = OffsetDateTime.now(ZoneOffset.UTC),
      rows = sortedCases
    )

  val path = Paths.get(if (isDev) "./ui/src" else ".", "results.json").toAbsolutePath()
  deleteStaleData(path)
  val exportBytes = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(results)
  Files.write(path, exportBytes.toByteArray())
  println("Results exported to $path")
}