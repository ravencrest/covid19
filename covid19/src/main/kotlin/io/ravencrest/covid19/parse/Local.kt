package io.ravencrest.covid19.parse

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

val isDev = Paths.get("./build.gradle").toAbsolutePath().toFile().exists()
val rootPath = if (isDev) "data" else ".."

// Population data is manually scraped from https://www.worldometers.info/world-population/population-by-country/ It'd be nice to find a better source
val populationPath: Path = Paths.get(rootPath, "population.csv").toAbsolutePath()

// Manually generated list that maps the country labels in the population data to the COVID-19 time series country labels
val countriesPath: Path = Paths.get(rootPath, "countries.csv").toAbsolutePath()

// Manually generated list for data we don't want to io.ravencrest.covid19.io.ravencrest.covid19.parse.parse
val blacklistPath: Path = Paths.get(rootPath, "blacklist.txt").toAbsolutePath()

fun loadCountries(): Map<String, String> {
  val map = mutableMapOf<String, String>()
  readCsvToStringArray(countriesPath).forEach {
    val normalizedValue = it[0]
    for (i in 1 until it.size) {
      val key = it[i]
      map[key] = normalizedValue
    }
  }
  return map.toMap()
}

fun loadPopulations(countries: Map<String, String>): Map<String, Long> {
  val csvIterator =
    readCsvToStringArray(populationPath)
  return csvIterator.asSequence().associateBy({ row -> row[0] }, { row -> row[1].toLong() }).toMutableMap()
    .let { populations ->
      // Combine territory populations with their sovereign state population
      countries.forEach { (rawState, normalizedState) ->
        // Look up the territory and state names and map them to the appropriate key for the population data
        val normalizedPop = populations[normalizedState] ?: 0
        val rawPop = populations[rawState] ?: 0

        val population = normalizedPop + rawPop
        populations.remove(normalizedState)
        populations.remove(rawState)
        populations[normalizedState] = population
      }
      populations.toMap()
    }
}

fun loadBlacklist(): Set<String> {
  return Files.newBufferedReader(blacklistPath).readLines().toSet()
}