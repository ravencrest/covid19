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
import java.time.OffsetDateTime
import java.time.ZoneOffset

fun main() {
  val jsonMapper = ObjectMapper()
    .registerModule(JavaTimeModule())
    .registerModule(KotlinModule())
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)

  val countriesIndex = loadCountries()
  val populationIndex = loadPopulations(countriesIndex)

  val rawCases = parseCsseCases(countriesIndex)
  val deathsIndex = parseCsseDeaths(countriesIndex).associateBy { it.country }
  val recoveredIndex = parseCsseRecovered(countriesIndex).associateBy { it.country }

  val changes = rawCases.mapNotNull {
    val recovered = recoveredIndex[it.country]?.points?.associateBy { point -> point.date }
    val points = it.points.map { point ->
      point.copy(value = point.value - (recovered?.get(point.date)?.value ?: 0 ))
    }
    it.copy(points = points.toSet())
  }

  val sortedCases = rawCases.mapNotNull {
    it.last()?.let { p ->
      val secondToLast = it.secondToLast()
      val change = secondToLast?.value?.let { lastValue -> (p.value - lastValue) / p.value.toDouble()}
      val country = p.country
      val population = populationIndex[country] ?: error("Missing population data for $country")
      val deaths = deathsIndex[country]?.last()?.value ?: 0
      val recovered = recoveredIndex[country]?.last()?.value ?: 0

      TableRow(
        region = country,
        cases = p.value,
        casesNormalized = normalize(p.value, population),
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
    .let {
      Results(
        lastUpdated = OffsetDateTime.now(ZoneOffset.UTC),
        rows = it,
        graph = changes
      )
    }
  val path = Paths.get(if (isDev) "./ui/src" else ".", "results.json").toAbsolutePath()
  deleteStaleData(path)
  val exportBytes = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(sortedCases)
  Files.write(path, exportBytes.toByteArray())
  println("Results exported to $path")
}