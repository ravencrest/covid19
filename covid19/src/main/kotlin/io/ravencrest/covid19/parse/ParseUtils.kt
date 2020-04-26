package io.ravencrest.covid19.parse

import com.fasterxml.jackson.databind.MappingIterator
import com.fasterxml.jackson.dataformat.csv.CsvMapper
import com.fasterxml.jackson.dataformat.csv.CsvParser
import java.nio.file.Files
import java.nio.file.Path
import kotlin.math.roundToLong
import kotlin.system.exitProcess

// Originally, we used POJOs, but string arrays allows us to re-use code and simplifies a few things
fun readCsvToStringArray(path: Path): MappingIterator<Array<String>> {
  val csvMapper = CsvMapper()
  csvMapper.enable(CsvParser.Feature.WRAP_AS_ARRAY)
  val bufferedReader = Files.newBufferedReader(path)
  return csvMapper.readerFor(Array<String>::class.java).readValues(bufferedReader)
}

fun deleteStaleData(path: Path) {
  try {
    Files.deleteIfExists(path)
  } catch (e: Exception) {
    println("Failed to remove stale data at $path. Exiting.")
    exitProcess(1)
  }
}

fun normalize(value: Number, population: Long, normalizer: Int = 1_000_000): Long {
  return (value.toDouble() / population * normalizer).roundToLong()
}
