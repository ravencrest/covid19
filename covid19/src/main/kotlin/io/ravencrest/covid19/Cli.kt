package io.ravencrest.covid19

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ravencrest.covid19.model.Point
import io.ravencrest.covid19.parse.deleteStaleData
import io.ravencrest.covid19.parse.isDev
import io.ravencrest.covid19.parse.parseCsseCases
import java.nio.file.Files
import java.nio.file.Paths
import java.time.OffsetDateTime
import java.time.ZoneOffset

data class Results(val lastUpdated: OffsetDateTime, val rows: List<Point?>)

fun main() {
  val jsonMapper = ObjectMapper()
    .registerModule(JavaTimeModule())
    .registerModule(KotlinModule())
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
  val rawData = parseCsseCases()
  val sortedSeries = rawData.mapIndexed { index, it -> it.last(index) }.sortedWith(compareByDescending { v -> v?.normalizedValue }).mapIndexed { index, point -> point?.copy(rank = index + 1) }.let {
    Results(lastUpdated = OffsetDateTime.now(ZoneOffset.UTC), rows = it)
  }
  val path = Paths.get(if (isDev) "./ui/src" else ".","results.json").toAbsolutePath()
  deleteStaleData(path)
  val exportBytes = jsonMapper.writeValueAsString(sortedSeries)
  Files.write(path, exportBytes.toByteArray())
  println("Results exported to $path")
}