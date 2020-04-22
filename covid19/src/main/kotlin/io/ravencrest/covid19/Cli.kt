package io.ravencrest.covid19

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.ravencrest.covid19.parse.deleteStaleData
import io.ravencrest.covid19.parse.isDev
import io.ravencrest.covid19.parse.parseCsse
import java.nio.file.Files
import java.nio.file.Paths

fun main() {
  val jsonMapper = ObjectMapper()
    .registerModule(JavaTimeModule())
    .registerModule(KotlinModule())
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
  val rawData = parseCsse()
  val sortedSeries = rawData.mapIndexed { index, it -> it.last(index) }.sortedWith(compareByDescending { v -> v?.normalizedValue }).mapIndexed { index, point -> point?.copy(rank = index) }
  val path = Paths.get(if (isDev) "./ui/src" else ".","results.json").toAbsolutePath()
  deleteStaleData(path)
  val exportBytes = jsonMapper.writeValueAsString(sortedSeries)
  Files.write(path, exportBytes.toByteArray())
  println("Results exported to $path")
}