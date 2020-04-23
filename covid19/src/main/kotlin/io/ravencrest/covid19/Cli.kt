package io.ravencrest.covid19

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ravencrest.covid19.model.NORMALIZER
import io.ravencrest.covid19.model.TableRow
import io.ravencrest.covid19.parse.*
import java.nio.file.Files
import java.nio.file.Paths
import java.time.OffsetDateTime
import java.time.ZoneOffset
import kotlin.math.roundToLong

data class Results(val lastUpdated: OffsetDateTime, val rows: List<TableRow>)

fun main() {
  val jsonMapper = ObjectMapper()
    .registerModule(JavaTimeModule())
    .registerModule(KotlinModule())
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)

  val countries = loadCountries()
  val populations = loadPopulations(countries)

  val rawData = parseCsseCases()
  val sortedSeries = rawData.mapNotNull {
    it.last()?.let { p ->
      val population = populations[p.country] ?: error("Missing population data for ${p.country}")
      TableRow(
        region = p.country,
        cases = p.value,
        casesNormalized = (p.value.toDouble() / population * NORMALIZER).roundToLong()  ,
        deaths = 0,
        deathsNormalized = 0,
        population = population,
        rank = 0
      )
    }
  }
    .sortedWith(compareByDescending { v -> v.casesNormalized })
    .mapIndexed { index, tableRow ->  tableRow.copy(rank = index + 1)}
    .let { Results(lastUpdated = OffsetDateTime.now(ZoneOffset.UTC), rows = it) }
  val path = Paths.get(if (isDev) "./ui/src" else ".", "results.json").toAbsolutePath()
  deleteStaleData(path)
  val exportBytes = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(sortedSeries)
  Files.write(path, exportBytes.toByteArray())
  println("Results exported to $path")
}